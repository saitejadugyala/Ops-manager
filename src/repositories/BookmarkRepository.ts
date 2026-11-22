import { Bookmark } from '../models/Bookmark';
import { DatabaseClient } from '../utils/DatabaseClient';

export class BookmarkRepository {
  private dbClient: DatabaseClient;

  constructor(dbClient: DatabaseClient) {
    this.dbClient = dbClient;
  }

  async saveBookmark(bookmark: Bookmark): Promise<Bookmark> {
    const query = `
      INSERT INTO bookmarks (id, user_id, url, title, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const values = [bookmark.id, bookmark.userId, bookmark.url, bookmark.title];
    const result = await this.dbClient.query(query, values);
    return new Bookmark(result.rows[0]);
  }

  async fetchBookmarksByUserId(userId: string): Promise<Bookmark[]> {
    const query = `
      SELECT * FROM bookmarks WHERE user_id = $1 ORDER BY created_at DESC
    `;
    const result = await this.dbClient.query(query, [userId]);
    return result.rows.map(row => new Bookmark(row));
  }

  async updateBookmarkEntry(bookmark: Bookmark): Promise<Bookmark> {
    const query = `
      UPDATE bookmarks
      SET url = $1,
          title = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const values = [bookmark.url, bookmark.title, bookmark.id];
    const result = await this.dbClient.query(query, values);
    return new Bookmark(result.rows[0]);
  }

  async removeBookmark(id: string): Promise<void> {
    const query = `DELETE FROM bookmarks WHERE id = $1`;
    await this.dbClient.query(query, [id]);
  }
}
