"""
Claude Agent Component

Direct prompting architecture with configurable instructions.
- Direct Claude SDK communication
- Unified context always sent
- JSON response parsing
- Instructions loaded from configurable .md file
"""

from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    AssistantMessage
)
from typing import Any, Dict, List
import json
import os
from pathlib import Path


class ClaudeAgent:
    """
    Claude Agent with unified document editing architecture.

    Architecture:
    - Receives full context always (document, referred text, address, history)
    - Uses direct Claude SDK prompting (no tools)
    - Instructions loaded from configurable .md file
    - Returns JSON response with conversation + optional document update
    """

    def __init__(self, session_id: str, config: Dict = None):
        """
        Initialize Claude Agent for a session.

        Args:
            session_id: Unique session identifier
            config: Configuration dict (includes agentInstructionsFile path)
        """
        self.session_id = session_id
        self.config = config or {}

        # Load agent instructions from file
        self.system_instructions = self._load_instructions()

        # Configure SDK options (no tools, no MCP servers)
        self.options = ClaudeAgentOptions()

        # Create persistent SDK client (connection happens lazily)
        self.client = ClaudeSDKClient(options=self.options)
        self._connected = False

        print(f"[{self.session_id}] Claude Agent initialized")
        print(f"[{self.session_id}] Instructions loaded: {len(self.system_instructions)} chars")

    def _load_instructions(self) -> str:
        """
        Load agent instructions from configured file.

        Returns:
            Instructions text
        """
        # Get instructions file path from config
        instructions_file = self.config.get('editor-agent-instructions', 'instructions/agent-instructions.md')

        # Make path relative to this file's directory
        server_dir = Path(__file__).parent
        instructions_path = server_dir / instructions_file

        try:
            with open(instructions_path, 'r', encoding='utf-8') as f:
                instructions = f.read()
            print(f"[{self.session_id}] Loaded instructions from: {instructions_path}")
            return instructions
        except FileNotFoundError:
            print(f"[{self.session_id}] WARNING: Instructions file not found: {instructions_path}")
            print(f"[{self.session_id}] Using default instructions")
            return self._default_instructions()
        except Exception as e:
            print(f"[{self.session_id}] ERROR loading instructions: {e}")
            return self._default_instructions()

    def _default_instructions(self) -> str:
        """
        Fallback instructions if file not found.
        """
        return """
You are a document editing assistant.

Respond with JSON:
{
  "conversationMessage": "Your response",
  "documentUpdate": "Updated text (optional)",
  "updateRange": "start:end (optional)"
}

Include documentUpdate only when user requests an edit.
"""

    async def process(self, prompt: str, context: Dict = None, on_chunk=None) -> Dict:
        """
        Process user request with unified context.

        Args:
            prompt: User's message
            context: Document context (ALWAYS includes all fields):
                {
                    "documentContent": str (always, may be ""),
                    "referredText": str (always, may be ""),
                    "referredAddress": str (always, e.g. "0:0", "0:end", "31:204"),
                    "conversationHistory": list (always, may be []),
                    "systemInstructions": str (always, loaded from file)
                }
            on_chunk: Optional async callback function(text: str) called with each streaming chunk

        Returns:
            Response dict:
            {
                "conversationMessage": str (always),
                "documentUpdate": str (optional - only if edit requested),
                "updateRange": str (optional - which range was updated)
            }
        """
        if context is None:
            context = {}

        # Ensure all required fields are present with defaults
        context.setdefault('documentContent', '')
        context.setdefault('referredText', '')
        context.setdefault('referredAddress', '0:0')
        context.setdefault('conversationHistory', [])
        context.setdefault('systemInstructions', self.system_instructions)

        # Format prompt with context
        full_prompt = self._format_prompt_with_context(prompt, context)

        print(f"[{self.session_id}] Processing request...")
        print(f"[{self.session_id}] Document length: {len(context['documentContent'])} chars")
        print(f"[{self.session_id}] Referred address: {context['referredAddress']}")

        try:
            # Lazy connection on first use
            if not self._connected:
                print(f"[{self.session_id}] Connecting to Claude SDK...")
                await self.client.connect()
                self._connected = True
                print(f"[{self.session_id}] Connected successfully")

            # Send query to persistent client
            await self.client.query(full_prompt)

            # Collect streaming response
            response_text = []

            async for message in self.client.receive_response():
                # Process AssistantMessage blocks
                if isinstance(message, AssistantMessage) and message.content:
                    for block in message.content:
                        # Extract text blocks
                        if hasattr(block, 'text'):
                            chunk_text = block.text
                            response_text.append(chunk_text)

                            # Stream chunk to callback if provided
                            if on_chunk:
                                await on_chunk(chunk_text)

            # Join all response parts
            full_response = '\n'.join(response_text)

            print(f"[{self.session_id}] Raw response length: {len(full_response)} chars")

            # Parse JSON response
            parsed_response = self._parse_response(full_response, context)

            return parsed_response

        except Exception as e:
            print(f"[{self.session_id}] Error in agent process: {e}")
            import traceback
            traceback.print_exc()
            raise

    def _format_prompt_with_context(self, prompt: str, context: Dict) -> str:
        """
        Format prompt to include full context ALWAYS.

        Args:
            prompt: User's message
            context: Context dict with all fields

        Returns:
            Formatted prompt with complete context
        """
        parts = []

        # System Instructions (ALWAYS included)
        parts.append("=== SYSTEM INSTRUCTIONS ===")
        parts.append(context['systemInstructions'])
        parts.append("")

        # Document Content (ALWAYS included, even if empty)
        parts.append("=== DOCUMENT CONTENT ===")
        if context['documentContent']:
            parts.append(f"Full Document ({len(context['documentContent'])} chars):")
            parts.append(context['documentContent'])
        else:
            parts.append("(No document content)")
        parts.append("")

        # Referred Text and Address (ALWAYS included)
        parts.append("=== REFERRED TEXT ===")
        parts.append(f"Referred Address: {context['referredAddress']}")
        if context['referredText']:
            parts.append(f"Referred Text ({len(context['referredText'])} chars):")
            parts.append(context['referredText'])
        else:
            parts.append("(No referred text)")
        parts.append("")

        # Conversation History (ALWAYS included, even if empty)
        parts.append("=== CONVERSATION HISTORY ===")
        if context['conversationHistory']:
            for i, msg in enumerate(context['conversationHistory']):
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')
                parts.append(f"[{i+1}] {role}: {content[:100]}{'...' if len(content) > 100 else ''}")
        else:
            parts.append("(No previous conversation)")
        parts.append("")

        # User Request
        parts.append("=== USER REQUEST ===")
        parts.append(prompt)
        parts.append("")

        # Response Instructions
        parts.append("=== YOUR RESPONSE ===")
        parts.append("Respond with valid JSON only (no markdown, no code blocks):")
        parts.append('{"conversationMessage": "...", "documentUpdate": "...", "updateRange": "..."}')

        return '\n'.join(parts)

    def _parse_response(self, response_text: str, context: Dict) -> Dict:
        """
        Parse Claude's response into structured format.

        Args:
            response_text: Raw text response from Claude
            context: Original context (for fallback)

        Returns:
            Structured response dict
        """
        # Try to extract JSON from response
        json_response = None

        # Strategy 1: Try parsing entire response as JSON
        try:
            json_response = json.loads(response_text.strip())
        except json.JSONDecodeError:
            pass

        # Strategy 2: Look for JSON within markdown code blocks
        if not json_response:
            import re
            # Match ```json ... ``` or ``` ... ```
            json_blocks = re.findall(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            for block in json_blocks:
                try:
                    json_response = json.loads(block)
                    break
                except json.JSONDecodeError:
                    continue

        # Strategy 3: Look for JSON object in text
        if not json_response:
            json_match = re.search(r'\{[^{}]*"conversationMessage"[^{}]*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    json_response = json.loads(json_match.group(0))
                except json.JSONDecodeError:
                    pass

        # If we successfully parsed JSON, validate and return
        if json_response and isinstance(json_response, dict):
            result = {
                "conversationMessage": json_response.get("conversationMessage", "")
            }

            # Include documentUpdate if present
            if "documentUpdate" in json_response and json_response["documentUpdate"]:
                result["documentUpdate"] = json_response["documentUpdate"]

            # Include updateRange if present
            if "updateRange" in json_response and json_response["updateRange"]:
                result["updateRange"] = json_response["updateRange"]

            print(f"[{self.session_id}] Parsed JSON response successfully")
            print(f"[{self.session_id}] Has documentUpdate: {'documentUpdate' in result}")

            return result

        # Fallback: Claude didn't return proper JSON
        print(f"[{self.session_id}] WARNING: Could not parse JSON from response")
        print(f"[{self.session_id}] Response preview: {response_text[:200]}...")

        # Return response text as conversationMessage
        return {
            "conversationMessage": response_text.strip() or "I encountered an error processing your request."
        }

    async def cleanup(self):
        """
        Cleanup agent resources and disconnect SDK client.
        """
        if self._connected:
            print(f"[{self.session_id}] Disconnecting Claude SDK client...")
            try:
                await self.client.disconnect()
                self._connected = False
                print(f"[{self.session_id}] Disconnected successfully")
            except Exception as e:
                print(f"[{self.session_id}] Error during disconnect: {e}")
        else:
            print(f"[{self.session_id}] Claude Agent cleanup (was not connected)")
