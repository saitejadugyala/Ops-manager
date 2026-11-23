import express, { Router } from 'express';
import { BookmarkService } from '../bookmark/BookmarkService';
import { AuthService } from '../auth/AuthService';

export class IntegrationAdapter {
  private router: Router;
  private bookmarkService: BookmarkService;
  private authService: AuthService;

  constructor(bookmarkService: BookmarkService, authService: AuthService) {
    this.router = express.Router();
    this.bookmarkService = bookmarkService;
    this.authService = authService;
  }

  /**
   * Registers the Bookmark Agent API endpoints on the router
   */
  public registerBookmarkAPIEndpoints(): void {
    // Middleware to verify authentication for bookmark routes
    this.router.use('/bookmarks', this.authMiddleware.bind(this));

    // Create a new bookmark
    this.router.post('/bookmarks', async (req, res, next) => {
      try {
        const userId = (req as any).userId;
        const { url, title, id } = req.body;
        // Handle update via POST if id is present, for UI compatibility
        if (id) {
          const bookmarkId = id;
          const updateData = { url, title };
          const updatedBookmark = await this.bookmarkService.updateBookmark(userId, bookmarkId, updateData);
          res.json(updatedBookmark);
        } else {
          const bookmarkData = { url, title };
          const bookmark = await this.bookmarkService.createBookmark(userId, bookmarkData);
          res.status(201).json(bookmark);
        }
      } catch (err) {
        next(err);
      }
    });

    // Get all bookmarks for the authenticated user
    this.router.get('/bookmarks', async (req, res, next) => {
      try {
        const userId = (req as any).userId;
        // Ignore any userId passed as query parameter for security
        const bookmarks = await this.bookmarkService.getBookmarksForUser(userId);
        res.json(bookmarks);
      } catch (err) {
        next(err);
      }
    });

    // Delete a bookmark by id
    this.router.delete('/bookmarks/:id', async (req, res, next) => {
      try {
        const userId = (req as any).userId;
        const bookmarkId = req.params.id;
        await this.bookmarkService.deleteBookmark(userId, bookmarkId);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    });
  }

  /**
   * Integrates authentication service to add user context to the request
   */
  private authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).json({ error: 'Unauthorized: Missing token' });
        return;
      }
      const userId = this.authService.verifyToken(token);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
        return;
      }
      (req as any).userId = userId;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }

  /**
   * Gets the configured router with all integrated routes
   */
  public configureRouting(): Router {
    this.registerBookmarkAPIEndpoints();
    return this.router;
  }
}
