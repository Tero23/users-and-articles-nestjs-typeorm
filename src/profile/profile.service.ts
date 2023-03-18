import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ProfileType } from './types/profile.type';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { ProfileResponseInterface } from './types/profileResponse.interface';
import { FollowEntity } from './follow.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async getProfile(userId: number, username: string): Promise<ProfileType> {
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new HttpException('Profile does not exist!', HttpStatus.NOT_FOUND);
    }

    const follow = await this.followRepository.findOne({
      where: {
        followerId: userId,
        followingId: user.id,
      },
    });

    return { ...user, following: Boolean(follow) };
  }

  buildProfileResponse(profile: ProfileType): ProfileResponseInterface {
    delete profile.email;
    return { profile };
  }

  async followProfile(userId: number, username: string): Promise<ProfileType> {
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new HttpException('Profile does not exist!', HttpStatus.NOT_FOUND);
    }
    if (userId === user.id) {
      throw new HttpException(
        'You cannot follow yourself!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingFollow = await this.followRepository.findOne({
      where: {
        followerId: userId,
        followingId: user.id,
      },
    });

    if (!existingFollow) {
      const follow = this.followRepository.create({
        followerId: userId,
        followingId: user.id,
      });
      await this.followRepository.save(follow);
    }

    return { ...user, following: true };
  }
  async unFollowProfile(
    userId: number,
    username: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new HttpException('Profile does not exist!', HttpStatus.NOT_FOUND);
    }
    if (userId === user.id) {
      throw new HttpException(
        'You cannot unfollow yourself!',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.followRepository.delete({
      followerId: userId,
      followingId: user.id,
    });

    return { ...user, following: false };
  }
}
