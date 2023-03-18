import { MigrationInterface, QueryRunner } from 'typeorm';

export class seeds1678874317812 implements MigrationInterface {
  name = 'tables1678874317812';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO tags (name) VALUES ('dragons'), ('coffee'), ('nestjs')`,
    );

    await queryRunner.query(
      `INSERT INTO users (username, email, password) VALUES ('Tero', 'doumaniant@gmail.com', '$2b$10$sj..UawT1ncWYOTVlWwNQOGFSJv/cMXJ2n7dG/yi7dAO16.uSRNfa'),
       ('Serly', 'doumanians@gmail.com', '$2b$10$sj..UawT1ncWYOTVlWwNQOGFSJv/cMXJ2n7dG/yi7dAO16.uSRNfa')`, // password is: Password@123
    );

    await queryRunner.query(
      `INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES 
      ('first-article', 'First article', 'First article description', 'First article body', 'coffee,dragons', 1), 
      ('second-article', 'Second article', 'Second article description', 'Second article body', 'coffee,dragons', 1), 
      ('third-article', 'Third article', 'Third article description', 'Third article body', 'coffee,dragons', 2), 
      ('fourth-article', 'Fourth article', 'Fourth article description', 'Fourth article body', 'coffee,dragons', 2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
