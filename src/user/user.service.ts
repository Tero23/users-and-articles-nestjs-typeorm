import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { UserEntity } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { UserResponseInterface } from './types/userResponse.interface';
import { LoginUserDto } from './dto/loginUser.dto';
import { compare } from 'bcrypt';
import { UpdateUserDto } from './dto/updateUser.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        {
          username: createUserDto.username,
        },
      ],
    });

    if (existingUser) {
      throw new HttpException(
        'email or username are taken',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const newUser = new UserEntity();
    Object.assign(newUser, createUserDto);
    console.log(newUser);
    return await this.userRepository.save(newUser);
  }

  async findById(id: number): Promise<UserEntity> {
    return this.userRepository.findOne({ where: { id } });
  }

  async loginUser(loginUserDto: LoginUserDto): Promise<UserResponseInterface> {
    const user = await this.userRepository.findOne({
      where: [{ email: loginUserDto.email }],
      select: ['id', 'email', 'password', 'username', 'bio', 'image'],
    });
    if (!user) {
      throw new HttpException(
        'Invalid email or password!',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const passIsCorrect = await compare(loginUserDto.password, user.password);
    if (!passIsCorrect) {
      throw new HttpException(
        'Invalid email or password!',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    delete user.password;

    return this.buildUserResponse(user);
  }

  async updateUser(
    updateUserDto: UpdateUserDto,
    userId: number,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  generateJwt(user: UserEntity): string {
    return sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
    );
  }

  buildUserResponse(user: UserEntity): UserResponseInterface {
    return {
      user: {
        ...user,
        token: this.generateJwt(user),
      },
    };
  }
}
