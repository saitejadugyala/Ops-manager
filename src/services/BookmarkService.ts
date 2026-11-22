import { Bookmark, User } from '../models';
import { Database } from '../utils/Database';
import { UnauthorizedError, NotFoundError } from '../errors';

export class BookmarkService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Create a new bookmark associated with a user.
   * @param userId - The ID of the authenticated user creating the bookmark
   * @param bookmarkData - The data for the new bookmark
   * @returns The created Bookmark
   */
  async createBookmark(userId: string, bookmarkData: Partial<Bookmark>): Promise<Bookmark> {
    const bookmark = new Bookmark({
      ...bookmarkData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.db.bookmarks.insert(bookmark);
    return bookmark;
  }

  /**
   * Retrieve all bookmarks for a given user.
   * @param userId - The user ID whose bookmarks will be retrieved
   * @returns List of Bookmarks belonging to the user
   */
  async getBookmarksForUser(userId: string): Promise<Bookmark[]> {
    return this.db.bookmarks.find({ userId });
  }

  /**
   * Update an existing bookmark after authorization check.
   * @param userId - The ID of the user attempting the update
   * @param bookmarkId - The ID of the bookmark to update
   * @param updateData - The bookmark data to update
   * @returns The updated Bookmark
   * @throws UnauthorizedError if user cannot modify this bookmark
   * @throws NotFoundError if bookmark does not exist
   */
  async updateBookmark(userId: string, bookmarkId: string, updateData: Partial<Bookmark>): Promise<Bookmark> {
    const bookmark = await this.db.bookmarks.findById(bookmarkId);
    if (!bookmark) {
      throw new NotFoundError('Bookmark not found');
    }

    this.authorizeUserAction(userId, bookmark.userId);

    Object.assign(bookmark, updateData, { updatedAt: new Date() });
    await this.db.bookmarks.update(bookmark);
    return bookmark;
  }

  /**
   * Delete a bookmark after authorization check.
   * @param userId - The user attempting to delete the bookmark
   * @param bookmarkId - The bookmark ID to delete
   * @throws UnauthorizedError if user cannot delete this bookmark
   * @throws NotFoundError if bookmark does not exist
   */
  async deleteBookmark(userId: string, bookmarkId: string): Promise<void> {
    const bookmark = await this.db.bookmarks.findById(bookmarkId);
    if (!bookmark) {
      throw new NotFoundError('Bookmark not found');
    }

    this.authorizeUserAction(userId, bookmark.userId);

    await this.db.bookmarks.delete(bookmarkId);
  }

  /**
   * Check if the acting user is authorized to perform actions on a resource.
   * @param actingUserId - The user requesting the action
   * @param resourceOwnerId - The owner of the resource
   * @throws UnauthorizedError if actingUserId is not the owner
   */
  authorizeUserAction(actingUserId: string, resourceOwnerId: string): void {
    if (actingUserId !== resourceOwnerId) {
      throw new UnauthorizedError('User is not authorized to perform this action.');
    }
  }
}
