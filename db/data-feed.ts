import { DataSource, DataSourceOptions } from 'typeorm';
import { dataSourceOptions } from './data-source';
import { seeds1678874317812 } from './seeds/1678874317899-seeds';
import { TagEntity } from 'src/tag/tag.entity';
import { UserEntity } from 'src/user/user.entity';
import { ArticleEntity } from 'src/article/article.entity';

export const dataSourceOptions1: DataSourceOptions = {
  ...dataSourceOptions,
  entities: [TagEntity, UserEntity, ArticleEntity],
  migrations: [seeds1678874317812],
};

const dataSource = new DataSource(dataSourceOptions1);
export default dataSource;
