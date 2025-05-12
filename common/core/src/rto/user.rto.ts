/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ApiProperty } from '@nestjs/swagger'; // If you want Swagger docs here

export class UserRto {
  @ApiProperty({ description: "User's unique identifier" })
  id: string;

  @ApiProperty({
    example: 'test@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    required: false,
  })
  name?: string;

  @ApiProperty({ description: 'Timestamp of user creation' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp of last user update' })
  updatedAt: Date;

  static fromEntity(entity: any): UserRto {
    const rto = new UserRto();
    rto.id = entity._id?.toString() || entity.id;
    rto.email = entity.email;
    rto.name = entity.name;
    rto.createdAt = entity.createdAt;
    rto.updatedAt = entity.updatedAt;
    return rto;
  }
}
