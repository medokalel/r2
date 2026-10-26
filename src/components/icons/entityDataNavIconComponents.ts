import {
  EntityDataNavDocumentsIcon,
  EntityDataNavEntityIcon,
  EntityDataNavFeedbackIcon,
  EntityDataNavFieldIcon,
} from './entityDataNavIcons'

export const entityDataNavIconComponents = {
  entityData: EntityDataNavEntityIcon,
  field: EntityDataNavFieldIcon,
  documents: EntityDataNavDocumentsIcon,
  feedback: EntityDataNavFeedbackIcon,
} as const
