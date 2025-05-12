import { ApiProperty } from '@nestjs/swagger';
import { UserRto as CommonUserRto } from '@app/common/core'; // Import common UserRto

export class LoginResponseRto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: CommonUserRto }) // Use the common UserRto
  user: CommonUserRto;
}
