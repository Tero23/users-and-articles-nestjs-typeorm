import { ArticleEntity } from 'src/article/article.entity';
import { TagEntity } from 'src/tag/tag.entity';
import { UserEntity } from 'src/user/user.entity';
import { FollowEntity } from 'src/profile/follow.entity';
import { DataSource, DataSourceOptions } from 'typeorm';
import { tables1678874317812 } from './migrations/1678874317812-tables';
import { addFavoritesRelationsBetweenArticlesAndUsers1678882196459 } from './migrations/1678882196459-addFavoritesRelationsBetweenArticlesAndUsers';
import { follows1678982568300 } from './migrations/1678982568300-follows';

import { config } from 'dotenv';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'medium-clone',
  entities: [TagEntity, UserEntity, ArticleEntity, FollowEntity],
  migrations: [
    tables1678874317812,
    addFavoritesRelationsBetweenArticlesAndUsers1678882196459,
    follows1678982568300,
  ],
  //   synchronize: true,
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
