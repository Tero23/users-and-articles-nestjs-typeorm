import { IsEmail } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  readonly email: string;

  readonly username: string;

  readonly bio: string;

  readonly image: string;
}
