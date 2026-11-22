import React, { useState, useEffect } from 'react';
import { Button, Input, List, Modal, notification } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

interface Bookmark {
  id: string;
  title: string;
  url: string;
}

interface BookmarkItemProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({ bookmark, onEdit, onDelete }) => {
  return (
    <List.Item
      actions=[
        <Button
          icon={<EditOutlined />}
          type="text"
          onClick={() => onEdit(bookmark)}
          aria-label={`Edit bookmark titled ${bookmark.title}`}
        />,
        <Button
          icon={<DeleteOutlined />}
          type="text"
          danger
          onClick={() => onDelete(bookmark.id)}
          aria-label={`Delete bookmark titled ${bookmark.title}`}
        />
      ]
    >
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
        {bookmark.title}
      </a>
    </List.Item>
  );
};

const BookmarkUIComponent: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    // Load bookmarks from backend for current authenticated user
    const fetchBookmarks = async () => {
      try {
        const response = await fetch('/api/bookmarks');
        if (!response.ok) {
          throw new Error(`Failed to fetch bookmarks: ${response.statusText}`);
        }
        const data: Bookmark[] = await response.json();
        setBookmarks(data);
      } catch (error) {
        notification.error({ message: 'Failed to load bookmarks.' });
      }
    };

    fetchBookmarks();
  }, []);

  const resetModalFields = () => {
    setTitleInput('');
    setUrlInput('');
    setCurrentBookmark(null);
  };

  const showCreateModal = () => {
    resetModalFields();
    setModalMode('create');
    setIsModalVisible(true);
  };

  const showEditModal = (bookmark: Bookmark) => {
    setTitleInput(bookmark.title);
    setUrlInput(bookmark.url);
    setCurrentBookmark(bookmark);
    setModalMode('edit');
    setIsModalVisible(true);
  };

  const handleBookmarkCreation = async () => {
    if (!titleInput.trim() || !urlInput.trim()) {
      notification.error({ message: 'Both title and URL are required.' });
      return;
    }
    try {
      const bookmarkData = {
        title: titleInput.trim(),
        url: urlInput.trim(),
      };
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookmarkData),
      });
      if (!response.ok) {
        throw new Error(`Failed to create bookmark: ${response.statusText}`);
      }
      const createdBookmark: Bookmark = await response.json();
      setBookmarks(prev => [...prev, createdBookmark]);
      setIsModalVisible(false);
      resetModalFields();
      notification.success({ message: 'Bookmark created successfully.' });
    } catch (error) {
      notification.error({ message: 'Failed to create bookmark.' });
    }
  };

  const handleBookmarkEdit = async () => {
    if (!titleInput.trim() || !urlInput.trim() || !currentBookmark) {
      notification.error({ message: 'Both title and URL are required.' });
      return;
    }
    try {
      // Update using PUT to /api/bookmarks/:id as per backend specification
      const bookmarkData = {
        title: titleInput.trim(),
        url: urlInput.trim(),
      };
      const response = await fetch(`/api/bookmarks/${currentBookmark.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookmarkData),
      });
      if (!response.ok) {
        throw new Error(`Failed to update bookmark: ${response.statusText}`);
      }
      const updatedBookmark: Bookmark = await response.json();
      setBookmarks(prev =>
        prev.map(bm => (bm.id === updatedBookmark.id ? updatedBookmark : bm))
      );
      setIsModalVisible(false);
      resetModalFields();
      notification.success({ message: 'Bookmark updated successfully.' });
    } catch (error) {
      notification.error({ message: 'Failed to update bookmark.' });
    }
  };

  const handleBookmarkDeletion = (id: string) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete this bookmark?',
      onOk: async () => {
        try {
          const response = await fetch(`/api/bookmarks/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            throw new Error(`Failed to delete bookmark: ${response.statusText}`);
          }
          setBookmarks(prev => prev.filter(bm => bm.id !== id));
          notification.success({ message: 'Bookmark deleted successfully.' });
        } catch (error) {
          notification.error({ message: 'Failed to delete bookmark.' });
        }
      },
    });
  };

  const renderBookmarkList = () => {
    if (bookmarks.length === 0) {
      return <p>No bookmarks available. Create one!</p>;
    }
    return (
      <List
        itemLayout="horizontal"
        dataSource={bookmarks}
        renderItem={bookmark => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            onEdit={showEditModal}
            onDelete={handleBookmarkDeletion}
          />
        )}
      />
    );
  };

  return (
    <div className="bookmark-ui-component">
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
          Add Bookmark
        </Button>
      </div>
      {renderBookmarkList()}

      <Modal
        title={modalMode === 'create' ? 'Add Bookmark' : 'Edit Bookmark'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={modalMode === 'create' ? handleBookmarkCreation : handleBookmarkEdit}
        okText={modalMode === 'create' ? 'Create' : 'Save'}
      >
        <Input
          placeholder="Title"
          value={titleInput}
          onChange={e => setTitleInput(e.target.value)}
          maxLength={255}
          style={{ marginBottom: 12 }}
          autoFocus
        />
        <Input
          placeholder="URL"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          maxLength={2048}
          type="url"
        />
      </Modal>
    </div>
  );
};

export default BookmarkUIComponent;
