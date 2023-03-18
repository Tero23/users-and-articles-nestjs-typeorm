import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateArticleDto } from './dto/createArticle.dto';
import { ArticleEntity } from './article.entity';
import { DeleteResult, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { ArticleResponseInterface } from './types/articleResponse.interface';
import slugify from 'slugify';
import { ArticlesResponseInterface } from './types/articlesResponse.interface';
import { FollowEntity } from 'src/profile/follow.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async findAll(
    userId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const querybuilder = this.articleRepository
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author');

    if (query.tag) {
      querybuilder.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}%`,
      });
    }

    if (query.author) {
      const author = await this.userRepository.findOne({
        where: { username: query.author },
      });
      querybuilder.andWhere('articles.authorId = :id', {
        id: author.id,
      });
    }

    if (query.favorited) {
      const author = await this.userRepository.findOne({
        where: { username: query.favorited },
        relations: ['favorites'],
      });
      const ids = author.favorites.map((article) => article.id);

      console.log(ids);

      if (ids.length) {
        querybuilder.andWhere('articles.authorId IN (:...ids)', { ids });
      } else {
        querybuilder.andWhere('1=0');
      }
    }

    querybuilder.orderBy('articles.createdAt', 'DESC');

    const articlesCount = await querybuilder.getCount();

    if (query.limit) {
      querybuilder.limit(query.limit);
    }

    if (query.offset) {
      querybuilder.offset(query.offset);
    }

    const articles = await querybuilder.getMany();

    return { articles, articlesCount };
  }

  async getFeed(
    userId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const follows = await this.followRepository.find({
      where: {
        followerId: userId,
      },
    });

    if (!follows.length) {
      return { articles: [], articlesCount: 0 };
    }

    const followingUsersIds = follows.map((follow) => follow.followingId);
    const querybuilder = this.articleRepository
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .where('articles.authorId IN (:...ids)', { ids: followingUsersIds });

    querybuilder.orderBy('articles.createdAt', 'DESC');

    const articlesCount = await querybuilder.getCount();

    if (query.limit) {
      querybuilder.limit(query.limit);
    }

    if (query.offset) {
      querybuilder.offset(query.offset);
    }

    const articles = await querybuilder.getMany();

    return { articles, articlesCount };
  }

  async createArticle(
    user: UserEntity,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const article = new ArticleEntity();
    Object.assign(article, createArticleDto);
    if (!article.tagList) {
      article.tagList = [];
    }

    article.slug = this.getSlug(createArticleDto.title);
    article.author = user;

    return await this.articleRepository.save(article);
  }

  async deleteArticle(slug: string, userId: number): Promise<DeleteResult> {
    const article = await this.findBySlug(slug);
    if (!article)
      throw new HttpException('Article not found!', HttpStatus.NOT_FOUND);
    if (article.author.id !== userId)
      throw new HttpException('You are not an author!', HttpStatus.FORBIDDEN);

    return await this.articleRepository.delete({ slug });
  }

  async findBySlug(slug: string): Promise<ArticleEntity> {
    return await this.articleRepository.findOne({ where: { slug } });
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  private getSlug(title: string): string {
    return (
      slugify(title, { lower: true }) +
      '-' +
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }

  async updateArticle(
    slug: string,
    updateArticleDto: CreateArticleDto,
    userId: number,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);

    if (!article)
      throw new HttpException('Article not found!', HttpStatus.NOT_FOUND);
    if (article.author.id !== userId)
      throw new HttpException('You are not an author!', HttpStatus.FORBIDDEN);

    Object.assign(article, updateArticleDto);

    return await this.articleRepository.save(article);
  }

  async addArticleToFavorites(
    slug: string,
    userId: number,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favorites'],
    });

    const isNotFavorited =
      user.favorites.findIndex(
        (articleInFavorites) => articleInFavorites.id === article.id,
      ) === -1;

    if (isNotFavorited) {
      user.favorites.push(article);
      article.favoritesCount++;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  async deleteArticleFromFavorites(
    slug: string,
    userId: number,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favorites'],
    });

    console.log(user);

    const articleIndex = user.favorites.findIndex(
      (articleInFavorites) => articleInFavorites.id === article.id,
    );

    if (articleIndex >= 0) {
      user.favorites.splice(articleIndex, 1);
      article.favoritesCount--;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }
    return article;
  }
}
