// This DTO is for internal use within the authentication microservice
// The gateway will transform its HTTP DTO to this.
export class CreateUserInternalDto {
  email: string;
  password?: string; // Password will be hashed by the service/schema
  name?: string;
}
