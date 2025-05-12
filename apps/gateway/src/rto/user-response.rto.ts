import { ApiProperty } from '@nestjs/swagger';

export class UserResponseRto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class LoginResponseRto {
  @ApiProperty()
  accessToken: string;
  @ApiProperty({ type: UserResponseRto })
  user: UserResponseRto;
}
