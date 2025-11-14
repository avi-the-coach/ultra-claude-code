import Editor, { metadata as EditorMetadata } from './Editor';
import Chat, { metadata as ChatMetadata } from './Chat';

// Component registry: maps component type to React component
const ComponentRegistry = {
  'Editor': Editor,
  'Chat': Chat,
  // Future components go here
};

// Component metadata registry: maps component type to metadata
export const ComponentMetadata = {
  'Editor': EditorMetadata,
  'Chat': ChatMetadata,
  // Future components go here
};

export default ComponentRegistry;
