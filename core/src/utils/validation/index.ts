import { Draft, draft2019Config, draft07Config } from "json-schema-library";

export const validateSchemaData = (schema: any, data: any): boolean => {
  const { $schema } = schema;

  let validator;

  switch ($schema) {
    case "http://json-schema.org/draft-07/schema#":
      validator = new Draft(draft07Config, schema);
      break;
    default:
      validator = new Draft(draft2019Config, schema);
      break;
  }

  return validator.isValid(data);
};

export const validateSchema = (schema: any) => {
  const { $schema } = schema;

  let validator;

  switch ($schema) {
    case "http://json-schema.org/draft-07/schema#":
      validator = new Draft(draft07Config, schema);
      break;
    default:
      validator = new Draft(draft2019Config, schema);
      break;
  }
}