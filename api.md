# API Documentation

## Base URL
```
http://localhost:3333/api/v1
```

## Authentication

### User Authentication
- Uses JWT tokens stored in HTTP-only cookies
- Cookie name: `process.env.TOKEN_NAME` (typically `chattoken`)
- Token expires after 15 days
- All protected routes require authentication via `isAuthenticate` middleware

### Admin Authentication
- Uses JWT tokens stored in HTTP-only cookies
- Cookie name: `process.env.ADMIN_TOKEN_NAME` (typically `admintoken`)
- Token expires after 15 minutes
- Admin routes require authentication via `adminAuthenticate` middleware

---

## User APIs

### 1. Sign Up
**Endpoint:** `POST /user/signup`

**Description:** Create a new user account

**Authentication:** Not required

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `name` (string, required): User's full name
  - `username` (string, required): Unique username
  - `password` (string, required): User password
  - `bio` (string, required): User bio
  - `avatar` (file, required): Profile picture (image file)

**Response:**
```json
{
  "success": true,
  "message": "User Created!",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "username": "johndoe",
    "bio": "My bio",
    "avatar": {
      "public_id": "cloudinary_public_id",
      "url": "https://cloudinary_url"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Duplicate field (username already exists)
- `400`: Avatar not uploaded
- `500`: Server error

---

### 2. Login
**Endpoint:** `POST /user/login`

**Description:** Authenticate user and get access token

**Authentication:** Not required

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `username` (string, required): Username
  - `password` (string, required): Password

**Response:**
```json
{
  "success": true,
  "message": "Login Success!",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "username": "johndoe",
    "bio": "My bio",
    "avatar": {
      "public_id": "cloudinary_public_id",
      "url": "https://cloudinary_url"
    }
  }
}
```

**Error Responses:**
- `400`: User not found
- `400`: Incorrect password
- `500`: Server error

---

### 3. Get User Profile
**Endpoint:** `GET /user/profile`

**Description:** Get authenticated user's profile information

**Authentication:** Required

**Request:**
- **Headers:** Cookie with authentication token

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "username": "johndoe",
    "bio": "My bio",
    "avatar": {
      "public_id": "cloudinary_public_id",
      "url": "https://cloudinary_url"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: User not exist
- `500`: Server error

---

### 4. Update Profile Data
**Endpoint:** `PUT /user/updateprofiledata`

**Description:** Update user's name, username, and bio

**Authentication:** Required

**Request:**
- **Body:**
  ```json
  {
    "name": "John Doe Updated",
    "username": "johndoeupdated",
    "bio": "Updated bio"
  }
  ```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully !"
}
```

**Error Responses:**
- `400`: Username already exists
- `400`: Validation errors
- `500`: Server error

---

### 5. Update Profile Picture
**Endpoint:** `PUT /user/updateprofilepicture`

**Description:** Update user's profile picture

**Authentication:** Required

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `avatar` (file, required): New profile picture

**Response:**
```json
{
  "success": true,
  "message": "Profile picture updated successfully !"
}
```

**Error Responses:**
- `400`: No photo provided
- `400`: Error uploading to Cloudinary
- `500`: Server error

---

### 6. Logout
**Endpoint:** `GET /user/logout`

**Description:** Logout user by clearing authentication cookie

**Authentication:** Required

**Request:**
- **Headers:** Cookie with authentication token

**Response:**
```json
{
  "success": true,
  "message": "log out successfully !"
}
```

---

### 7. Search Users
**Endpoint:** `GET /user/search?name=<search_term>`

**Description:** Search for users by name (excludes friends)

**Authentication:** Required

**Request:**
- **Query Parameters:**
  - `name` (string, required): Search term

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "user_id",
      "name": "Jane Doe",
      "username": "janedoe",
      "bio": "Jane's bio",
      "avatar": "https://cloudinary_url"
    }
  ]
}
```

**Error Responses:**
- `400`: Invalid format
- `400`: Search error

---

### 8. Send Friend Request
**Endpoint:** `PUT /user/sendrequest`

**Description:** Send a friend request to another user

**Authentication:** Required

**Request:**
- **Body:**
  ```json
  {
    "userId": "target_user_id"
  }
  ```

**Response:**
```json
{
  "success": true,
  "message": "request sent successfully !"
}
```

**Error Responses:**
- `400`: Request already sent
- `400`: Validation errors

**WebSocket Event:** Emits `NEW_REQUEST` to the target user

---

### 9. Accept/Reject Friend Request
**Endpoint:** `PUT /user/acceptrequest`

**Description:** Accept or reject a friend request

**Authentication:** Required

**Request:**
- **Body:**
  ```json
  {
    "requestId": "request_id",
    "accept": true
  }
  ```
  - `accept` (boolean, required): `true` to accept, `false` to reject

**Response (Accept):**
```json
{
  "success": true,
  "message": "request accepted successfully !",
  "senderId": "sender_user_id"
}
```

**Response (Reject):**
```json
{
  "success": true,
  "message": "request rejected !"
}
```

**Error Responses:**
- `400`: Request not found
- `401`: Not authorized (not the receiver)
- `400`: Invalid format

**WebSocket Event:** Emits `REFETCH_CHATS` to both users when accepted

---

### 10. Get Notifications
**Endpoint:** `GET /user/notifications`

**Description:** Get all pending friend requests for the authenticated user

**Authentication:** Required

**Request:**
- **Headers:** Cookie with authentication token

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "request_id",
      "sender": {
        "_id": "sender_user_id",
        "name": "Jane Doe",
        "avatar": "https://cloudinary_url"
      }
    }
  ]
}
```

**Error Responses:**
- `400`: Invalid format
- `400`: Error fetching notifications

---

### 11. Get User Friends
**Endpoint:** `GET /user/userfriends?chatid=<chat_id>&name=<search_term>`

**Description:** Get all friends of the authenticated user

**Authentication:** Required

**Request:**
- **Query Parameters:**
  - `chatid` (string, optional): Exclude members of this chat
  - `name` (string, optional): Search friends by name

**Response:**
```json
{
  "success": true,
  "allFriends": [
    {
      "_id": "friend_user_id",
      "name": "Jane Doe",
      "avatar": "https://cloudinary_url"
    }
  ]
}
```

**Error Responses:**
- `400`: Invalid format
- `400`: Error fetching friends

---

## Chat APIs

### 1. Create Group Chat
**Endpoint:** `POST /chat/creategroup`

**Description:** Create a new group chat

**Authentication:** Required

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `name` (string, required): Group name
  - `members` (array, required): Array of user IDs to add to the group
  - `avatar` (file, optional): Group avatar image

**Response:**
```json
{
  "success": true,
  "message": "group  created !"
}
```

**Error Responses:**
- `400`: Group must have at least 1 member
- `400`: Validation errors
- `400`: Error creating group

**WebSocket Events:** 
- Emits `ALERT` to all members
- Emits `REFETCH_CHATS` to all members

---

### 2. Get My Chats
**Endpoint:** `GET /chat/chats?name=<search_term>`

**Description:** Get all chats (personal and group) for the authenticated user

**Authentication:** Required

**Request:**
- **Query Parameters:**
  - `name` (string, optional): Search chats by name

**Response:**
```json
{
  "success": true,
  "mychats": [
    {
      "_id": "chat_id",
      "name": "Chat Name",
      "avatar": "https://cloudinary_url",
      "groupChat": false,
      "members": [
        {
          "_id": "member_id",
          "name": "Member Name",
          "avatar": {
            "public_id": "cloudinary_public_id",
            "url": "https://cloudinary_url"
          },
          "createdAt": "2024-01-01T00:00:00.000Z",
          "bio": "Member bio"
        }
      ]
    }
  ]
}
```

**Error Responses:**
- `400`: Error fetching chats

---

### 3. Get My Groups
**Endpoint:** `GET /chat/groups`

**Description:** Get all group chats for the authenticated user

**Authentication:** Required

**Request:**
- **Headers:** Cookie with authentication token

**Response:**
```json
{
  "success": true,
  "groupChats": [
    {
      "_id": "chat_id",
      "name": "Group Name",
      "groupChat": true,
      "avatar": {
        "public_id": "cloudinary_public_id",
        "url": "https://cloudinary_url"
      },
      "creator": "creator_user_id",
      "members": ["member_id1", "member_id2"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `400`: Error fetching groups

---

### 4. Add Members to Group
**Endpoint:** `PUT /chat/addmembers`

**Description:** Add new members to a group (admin only)

**Authentication:** Required

**Request:**
- **Body:**
  ```json
  {
    "chatId": "group_chat_id",
    "new_members": ["user_id1", "user_id2"]
  }
  ```
  - `new_members` (array, required): Array of user IDs (minimum 1 member)

**Response:**
```json
{
  "success": true,
  "message": "New members added successfully!"
}
```

**Error Responses:**
- `404`: Group not found
- `400`: Not a group
- `400`: Not authorized (not admin)
- `400`: Group size exceeds 10 members
- `400`: Validation errors

**WebSocket Events:**
- Emits `NEW_MESSAGE` with alert message
- Emits `REFETCH_CHATS` to all group members

---

### 5. Remove Members from Group
**Endpoint:** `DELETE /chat/removemembers`

**Description:** Remove members from a group (admin only)

**Authentication:** Required

**Request:**
- **Body:**
  ```json
  {
    "chatId": "group_chat_id",
    "remove_members": ["user_id1", "user_id2"]
  }
  ```
  - `remove_members` (array, required): Array of user IDs (minimum 1 member)

**Response:**
```json
{
  "success": true,
  "message": "Members removed successfully!"
}
```

**Error Responses:**
- `404`: Group not found
- `400`: Not a group
- `400`: Not authorized (not admin)
- `400`: Group size must be at least 2 members
- `400`: Validation errors

**WebSocket Events:**
- Emits `NEW_MESSAGE` with alert message
- Emits `MEMBER_REMOVED` to removed members
- Emits `REFETCH_CHATS` to all group members

---

### 6. Leave Group
**Endpoint:** `GET /chat/leave/:id`

**Description:** Leave a group chat

**Authentication:** Required

**Request:**
- **URL Parameters:**
  - `id` (string, required): Chat ID

**Response:**
```json
{
  "success": true,
  "message": "You left the group (Group Name) successfully!"
}
```

**Error Responses:**
- `404`: Group not found
- `400`: Not a group
- `400`: Group must have at least 2 members
- `400`: Validation errors

**WebSocket Events:**
- Emits `NEW_MESSAGE` with alert message
- Emits `REFETCH_CHATS` to remaining group members

---

### 7. Send Attachments
**Endpoint:** `POST /chat/sendattachments`

**Description:** Send files (images, videos, etc.) to a chat

**Authentication:** Required

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `chatId` (string, required): Chat ID
  - `files` (file[], required): Array of files (1-5 files)

**Response:**
```json
{
  "success": true,
  "message": {
    "_id": "message_id",
    "content": "",
    "attachments": [
      {
        "public_id": "cloudinary_public_id",
        "url": "https://cloudinary_url"
      }
    ],
    "tempId": "uuid",
    "sender": "sender_user_id",
    "chat": "chat_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Invalid number of files (must be 1-5)
- `400`: Chat not found
- `400`: No attachments provided
- `400`: Validation errors

**WebSocket Events:**
- Emits `NEW_MESSAGE` to all chat members
- Emits `NEW_MESSAGE_ALERT` to all chat members

---

### 8. Get Chat Details
**Endpoint:** `GET /chat/:id?populate=true`

**Description:** Get details of a specific chat

**Authentication:** Required

**Request:**
- **URL Parameters:**
  - `id` (string, required): Chat ID
- **Query Parameters:**
  - `populate` (string, optional): Set to `"true"` to populate members with full user data

**Response (without populate):**
```json
{
  "success": true,
  "curchat": {
    "_id": "chat_id",
    "name": "Chat Name",
    "groupChat": false,
    "avatar": {
      "public_id": "cloudinary_public_id",
      "url": "https://cloudinary_url"
    },
    "creator": "creator_user_id",
    "members": ["member_id1", "member_id2"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (with populate=true):**
```json
{
  "success": true,
  "curchat": {
    "_id": "chat_id",
    "name": "Chat Name",
    "groupChat": false,
    "avatar": {
      "public_id": "cloudinary_public_id",
      "url": "https://cloudinary_url"
    },
    "creator": "creator_user_id",
    "members": [
      {
        "_id": "member_id",
        "name": "Member Name",
        "avatar": {
          "public_id": "cloudinary_public_id",
          "url": "https://cloudinary_url"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Chat not found
- `400`: Not a member of this chat
- `400`: Invalid format

---

### 9. Get Chat Profile Data
**Endpoint:** `GET /chat/getchatprofiledata/:id`

**Description:** Get profile data for a chat (returns other user for personal chats, group info for group chats)

**Authentication:** Required

**Request:**
- **URL Parameters:**
  - `id` (string, required): Chat ID

**Response (Personal Chat):**
```json
{
  "success": true,
  "profileData": {
    "_id": "user_id",
    "name": "User Name",
    "username": "username",
    "bio": "User bio",
    "avatar": {
      "public_id": "cloudinary_public_id",
      "url": "https://cloudinary_url"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (Group Chat):**
```json
{
  "success": true,
  "profileData": {
    "_id": "chat_id",
    "avatar": {
      "public_id": "cloudinary_public_id",
      "url": "https://cloudinary_url"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "name": "Group Name",
    "creator": "creator_user_id"
  }
}
```

**Error Responses:**
- `400`: Chat not found
- `400`: Not a member of this chat
- `400`: Invalid format

---

### 10. Update Group Info
**Endpoint:** `POST /chat/:id`

**Description:** Update group name and/or avatar (admin only)

**Authentication:** Required

**Request:**
- **Content-Type:** `multipart/form-data`
- **URL Parameters:**
  - `id` (string, required): Chat ID
- **Body:**
  - `name` (string, required): New group name
  - `avatar` (file, optional): New group avatar

**Response:**
```json
{
  "success": true,
  "message": "Group info changed successfully!"
}
```

**Error Responses:**
- `400`: Group not found
- `400`: Not a group
- `400`: Validation errors

**WebSocket Events:**
- Emits `NEW_MESSAGE` with alert message
- Emits `REFETCH_CHATS` to all group members

---

### 11. Delete Chat
**Endpoint:** `DELETE /chat/:id`

**Description:** Delete a chat (admin for groups, any member for personal chats)

**Authentication:** Required

**Request:**
- **URL Parameters:**
  - `id` (string, required): Chat ID

**Response:**
```json
{
  "success": true,
  "message": "Group deleted successfully!"
}
```

**Error Responses:**
- `400`: Chat not found
- `400`: Not authorized (only admin can delete groups)
- `400`: Not a member of this chat
- `400`: Validation errors

**WebSocket Events:**
- Emits `REFETCH_CHATS` to all chat members

---

### 12. Get Messages
**Endpoint:** `GET /chat/messages/:id?page=<page_number>`

**Description:** Get paginated messages for a chat

**Authentication:** Required

**Request:**
- **URL Parameters:**
  - `id` (string, required): Chat ID
- **Query Parameters:**
  - `page` (number, required): Page number (starts from 1)

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "_id": "message_id",
      "content": "Message content",
      "attachments": [],
      "tempId": "uuid",
      "isPoll": false,
      "options": [],
      "isAlert": false,
      "status": "send",
      "sender": {
        "_id": "sender_user_id",
        "name": "Sender Name",
        "avatar": {
          "public_id": "cloudinary_public_id",
          "url": "https://cloudinary_url"
        }
      },
      "chat": "chat_id",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalPages": 5
}
```

**Note:** Messages are returned in chronological order (oldest first). Each page contains 20 messages.

**Error Responses:**
- `404`: Chat not found
- `403`: Not a member of this chat
- `400`: Validation errors

---

### 13. Get Last Message Time
**Endpoint:** `GET /chat/getlastmessagetime/:id?page=<page_number>`

**Description:** Get the last message in a chat with pagination info

**Authentication:** Required

**Request:**
- **URL Parameters:**
  - `id` (string, required): Chat ID
- **Query Parameters:**
  - `page` (number, required): Page number (starts from 1)

**Response:**
```json
{
  "success": true,
  "lastMessage": {
    "_id": "message_id",
    "content": "Last message content",
    "attachments": [],
    "sender": {
      "_id": "sender_user_id",
      "name": "Sender Name",
      "avatar": {
        "public_id": "cloudinary_public_id",
        "url": "https://cloudinary_url"
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "totalPages": 5
}
```

**Error Responses:**
- `404`: Chat not found
- `403`: Not a member of this chat
- `400`: Validation errors

---

### 14. Change Messages to Online
**Endpoint:** `GET /chat/changemessagetoonline`

**Description:** Update message status from "send" to "online" for all personal chats

**Authentication:** Required

**Request:**
- **Headers:** Cookie with authentication token

**Response:**
```json
{
  "success": true,
  "message": "messages's status changed from send to online successfully !",
  "myChatsIds": ["chat_id1", "chat_id2"],
  "members": ["member_id1", "member_id2"],
  "userId": "user_id"
}
```

**WebSocket Events:**
- Emits `REFETCH_MESSAGES` with status "online" to chat members

---

### 15. Change Messages to Seen
**Endpoint:** `GET /chat/changemessagetoseen/:id`

**Description:** Update message status from "online" to "seen" for a specific chat

**Authentication:** Required

**Request:**
- **URL Parameters:**
  - `id` (string, required): Chat ID

**Response:**
```json
{
  "success": true,
  "message": "messages's status changed from online to seen successfully !",
  "messages": {
    "acknowledged": true,
    "modifiedCount": 5,
    "matchedCount": 5
  },
  "members": ["member_id1", "member_id2"]
}
```

**WebSocket Events:**
- Emits `REFETCH_MESSAGES` with status "seen" to chat members

---

## Admin APIs

### 1. Admin Login
**Endpoint:** `PUT /admin/login`

**Description:** Authenticate admin with secret key

**Authentication:** Not required

**Request:**
- **Body:**
  ```json
  {
    "secretKey": "admin_secret_key"
  }
  ```

**Response:**
```json
{
  "sucess": "true",
  "message": "Login successfull as Admin "
}
```

**Error Responses:**
- `401`: Secret key is incorrect
- `400`: Error during admin login

---

### 2. Admin Verify
**Endpoint:** `GET /admin/`

**Description:** Verify admin authentication status

**Authentication:** Required (Admin)

**Request:**
- **Headers:** Cookie with admin authentication token

**Response:**
```json
{
  "admin": true
}
```

**Error Responses:**
- `400`: Error verifying admin

---

### 3. Admin Logout
**Endpoint:** `GET /admin/logout`

**Description:** Logout admin by clearing authentication cookie

**Authentication:** Required (Admin)

**Request:**
- **Headers:** Cookie with admin authentication token

**Response:**
```json
{
  "sucess": "true",
  "message": "admin logout successfully!"
}
```

**Error Responses:**
- `400`: Error during logout

---

### 4. Get All Users
**Endpoint:** `GET /admin/users`

**Description:** Get all users with their statistics

**Authentication:** Required (Admin)

**Request:**
- **Headers:** Cookie with admin authentication token

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "name": "John Doe",
      "_id": "user_id",
      "avatar": "https://cloudinary_url",
      "username": "johndoe",
      "groups": 3,
      "friends": 10
    }
  ]
}
```

**Error Responses:**
- `400`: Error fetching users

---

### 5. Get All Chats
**Endpoint:** `GET /admin/chats`

**Description:** Get all chats (personal and group) with statistics

**Authentication:** Required (Admin)

**Request:**
- **Headers:** Cookie with admin authentication token

**Response:**
```json
{
  "success": true,
  "chats": [
    {
      "_id": "chat_id",
      "groupChat": true,
      "name": "Group Name",
      "avatar": ["https://avatar1_url", "https://avatar2_url"],
      "members": [
        {
          "_id": "member_id",
          "name": "Member Name",
          "avatar": "https://cloudinary_url"
        }
      ],
      "creator": {
        "name": "Creator Name",
        "avatar": "https://cloudinary_url"
      },
      "totalMembers": 5,
      "totalMessages": 150
    }
  ]
}
```

**Error Responses:**
- `400`: Error fetching chats

---

### 6. Get All Messages
**Endpoint:** `GET /admin/messages`

**Description:** Get all messages across all chats

**Authentication:** Required (Admin)

**Request:**
- **Headers:** Cookie with admin authentication token

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "_id": "message_id",
      "attachments": [],
      "content": "Message content",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "chat": "chat_id",
      "groupChat": false,
      "sender": {
        "_id": "sender_user_id",
        "name": "Sender Name",
        "avatar": "https://cloudinary_url"
      }
    }
  ]
}
```

**Error Responses:**
- `400`: Error fetching messages

---

### 7. Get Dashboard Stats
**Endpoint:** `GET /admin/stats`

**Description:** Get dashboard statistics including message counts and chart data

**Authentication:** Required (Admin)

**Request:**
- **Headers:** Cookie with admin authentication token

**Response:**
```json
{
  "success": true,
  "stats": {
    "msgCount": 1000,
    "chatCount": 50,
    "usersCount": 25,
    "groupChatCount": 10,
    "messageChart": [5, 10, 15, 20, 25, 30, 35]
  }
}
```

**Note:** `messageChart` is an array of 7 values representing message counts for the last 7 days (oldest to newest).

**Error Responses:**
- `400`: Error fetching dashboard stats

---

## WebSocket Events

### Connection
WebSocket connections are authenticated using the same JWT token stored in cookies. The server uses Socket.IO for real-time communication.

**Connection URL:** Same as base URL (typically `http://localhost:3333`)

**Authentication:** Automatic via cookie authentication middleware

---

### Client → Server Events

#### 1. NEW_MESSAGE
**Event:** `NEW_MESSAGE`

**Description:** Send a new text message or poll to a chat

**Payload:**
```json
{
  "message": "Message content",
  "chatid": "chat_id",
  "members": ["member_id1", "member_id2"],
  "isPoll": false,
  "options": [],
  "otherMember": "other_member_id"
}
```

**Response:** Server emits `NEW_MESSAGE` and `NEW_MESSAGE_ALERT` events to all connected clients

---

#### 2. UPDATE_POLL
**Event:** `UPDATE_POLL`

**Description:** Update poll vote (add or remove vote from an option)

**Payload:**
```json
{
  "tempId": "message_temp_id",
  "optionIdx": 0,
  "userId": "user_id",
  "chatId": "chat_id",
  "userData": {
    "_id": "user_id",
    "name": "User Name"
  }
}
```

**Response:** Server emits `UPDATE_POLL` event with updated poll data

---

#### 3. SCHEDULE_MESSAGE
**Event:** `SCHEDULE_MESSAGE`

**Description:** Schedule a message to be sent after a delay

**Payload:**
```json
{
  "message": "Scheduled message content",
  "chatid": "chat_id",
  "members": ["member_id1", "member_id2"],
  "otherMember": "other_member_id",
  "scheduleTime": 5
}
```

**Note:** `scheduleTime` is in minutes. The message will be sent after the specified delay.

**Response:** Server emits `NEW_MESSAGE` and `NEW_MESSAGE_ALERT` events after the delay

---

#### 4. START_TYPING
**Event:** `START_TYPING`

**Description:** Notify that user is typing in a chat

**Payload:**
```json
{
  "filteredMembers": [
    {
      "_id": "member_id",
      "name": "Member Name"
    }
  ],
  "chatid": "chat_id",
  "username": "typing_user_username"
}
```

**Response:** Server emits `START_TYPING` event to all chat members

---

#### 5. STOP_TYPING
**Event:** `STOP_TYPING`

**Description:** Notify that user stopped typing in a chat

**Payload:**
```json
{
  "filteredMembers": [
    {
      "_id": "member_id",
      "name": "Member Name"
    }
  ],
  "chatid": "chat_id"
}
```

**Response:** Server emits `STOP_TYPING` event to all chat members

---

#### 6. CHAT_JOINED
**Event:** `CHAT_JOINED`

**Description:** Notify that user joined/viewing a chat

**Payload:**
```json
{
  "userId": "user_id",
  "members": [
    {
      "_id": "member_id",
      "name": "Member Name"
    }
  ],
  "chatid": "chat_id"
}
```

**Response:** Server emits `CHAT_ONLINE_USERS` event with updated online users list

---

#### 7. CHAT_LEAVE
**Event:** `CHAT_LEAVE`

**Description:** Notify that user left/stopped viewing a chat

**Payload:**
```json
{
  "userId": "user_id",
  "members": [
    {
      "_id": "member_id",
      "name": "Member Name"
    }
  ],
  "chatid": "chat_id"
}
```

**Response:** Server emits `CHAT_ONLINE_USERS` event with updated online users list

---

### Server → Client Events

#### 1. ALERT
**Event:** `ALERT`

**Description:** General alert message sent to specific users

**Payload:**
```json
{
  "message": "Alert message content"
}
```

**Emitted when:**
- Group created with welcome message

---

#### 2. REFETCH_CHATS
**Event:** `REFETCH_CHATS`

**Description:** Signal to refetch chat list

**Payload:** No specific payload (just event name)

**Emitted when:**
- Friend request accepted
- Group created
- Members added/removed from group
- User leaves group
- Group info updated
- Chat deleted

---

#### 3. NEW_ATTACHMENT
**Event:** `NEW_ATTACHMENT`

**Description:** New attachment/file sent to a chat

**Payload:**
```json
{
  "chatId": "chat_id",
  "message": {
    "_id": "message_id",
    "tempId": "uuid",
    "content": "send new attachment",
    "attachments": [
      {
        "public_id": "cloudinary_public_id",
        "url": "https://cloudinary_url"
      }
    ],
    "chat": "chat_id",
    "sender": {
      "_id": "sender_user_id",
      "name": "Sender Name"
    }
  }
}
```

---

#### 4. NEW_MESSAGE_ALERT
**Event:** `NEW_MESSAGE_ALERT`

**Description:** Alert for new message (used for notifications)

**Payload:**
```json
{
  "chatid": "chat_id",
  "message": {
    "_id": "message_id",
    "tempId": "uuid",
    "content": "Message content",
    "attachments": [],
    "sender": {
      "_id": "sender_user_id",
      "name": "Sender Name",
      "chat": "chat_id",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "members": ["member_id1", "member_id2"]
}
```

---

#### 5. NEW_REQUEST
**Event:** `NEW_REQUEST`

**Description:** New friend request received

**Payload:** No specific payload (just event name)

**Emitted when:**
- Friend request sent to user

---

#### 6. NEW_MESSAGE
**Event:** `NEW_MESSAGE`

**Description:** New message received in a chat

**Payload:**
```json
{
  "chatId": "chat_id",
  "message": {
    "_id": "message_id",
    "tempId": "uuid",
    "content": "Message content",
    "attachments": [],
    "isPoll": false,
    "options": [],
    "sender": {
      "_id": "sender_user_id",
      "name": "Sender Name",
      "chat": "chat_id",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 7. UPDATE_POLL
**Event:** `UPDATE_POLL`

**Description:** Poll vote updated

**Payload:**
```json
{
  "tempId": "message_temp_id",
  "messageData": {
    "_id": "message_id",
    "content": "Poll question",
    "options": [
      {
        "content": "Option 1",
        "members": [
          {
            "_id": "user_id",
            "name": "User Name"
          }
        ]
      }
    ]
  },
  "chatId": "chat_id",
  "userId": "user_id"
}
```

---

#### 8. START_TYPING
**Event:** `START_TYPING`

**Description:** User started typing in a chat

**Payload:**
```json
{
  "chatid": "chat_id",
  "username": "typing_user_username",
  "filteredMembers": [
    {
      "_id": "member_id",
      "name": "Member Name"
    }
  ]
}
```

---

#### 9. STOP_TYPING
**Event:** `STOP_TYPING`

**Description:** User stopped typing in a chat

**Payload:**
```json
{
  "chatid": "chat_id",
  "filteredMembers": [
    {
      "_id": "member_id",
      "name": "Member Name"
    }
  ]
}
```

---

#### 10. MEMBER_REMOVED
**Event:** `MEMBER_REMOVED`

**Description:** Member removed from group

**Payload:**
```json
{
  "curChatId": "chat_id",
  "userId": "removed_user_id",
  "allChatMembers": ["member_id1", "member_id2"]
}
```

---

#### 11. CHAT_JOINED
**Event:** `CHAT_JOINED`

**Description:** User joined a chat (redundant, can be ignored)

---

#### 12. CHAT_LEAVE
**Event:** `CHAT_LEAVE`

**Description:** User left a chat (redundant, can be ignored)

---

#### 13. ONLINE_USERS
**Event:** `ONLINE_USERS`

**Description:** List of currently online user IDs

**Payload:**
```json
["user_id1", "user_id2", "user_id3"]
```

**Emitted when:**
- User connects/disconnects
- Updates when users come online/offline

---

#### 14. CHAT_ONLINE_USERS
**Event:** `CHAT_ONLINE_USERS`

**Description:** Map of users currently viewing specific chats

**Payload:**
```json
{
  "chatOnlineMembers": {
    "user_id1": "chat_id1",
    "user_id2": "chat_id2"
  },
  "chatId": "chat_id"
}
```

**Emitted when:**
- User joins/leaves a chat view
- User disconnects

---

#### 15. REFETCH_MESSAGES
**Event:** `REFETCH_MESSAGES`

**Description:** Signal to refetch messages (usually for status updates)

**Payload:**
```json
"online"
```
or
```json
"seen"
```

**Emitted when:**
- Message status changes (send → online → seen)

---

#### 16. LAST_CHAT_ONLINE
**Event:** `LAST_CHAT_ONLINE`

**Description:** Last online status for chat members (not currently implemented)

---

#### 17. LAST_ONLINE
**Event:** `LAST_ONLINE`

**Description:** Last online status for users (not currently implemented)

---

#### 18. SCHEDULE_MESSAGE
**Event:** `SCHEDULE_MESSAGE`

**Description:** Scheduled message sent (same as NEW_MESSAGE after delay)

---

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  username: String (required, unique),
  password: String (required, hashed),
  bio: String,
  lastSeen: String (ISO date string),
  avatar: {
    public_id: String (required),
    url: String (required)
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Chat Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  groupChat: Boolean (default: false),
  avatar: {
    public_id: String (required),
    url: String (required)
  },
  creator: ObjectId (ref: User),
  members: [ObjectId] (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  _id: ObjectId,
  content: String,
  attachments: [{
    public_id: String (required),
    url: String (required)
  }],
  tempId: String (required, unique),
  isPoll: Boolean (default: false),
  options: [{
    content: String,
    members: [ObjectId] (ref: User)
  }],
  isAlert: Boolean (default: false),
  status: String (enum: ["send", "online", "seen"], default: "send"),
  sender: ObjectId (ref: User, required),
  chat: ObjectId (ref: Chat, required),
  createdAt: Date,
  updatedAt: Date
}
```

### Request Model (Friend Requests)
```javascript
{
  _id: ObjectId,
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Handling

All API endpoints follow a consistent error response format:

**Success Response:**
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors, invalid input)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (not authorized)
- `404`: Not Found
- `500`: Internal Server Error

---

## Notes

1. **File Uploads:** All file uploads are handled via `multipart/form-data` and uploaded to Cloudinary
2. **Pagination:** Message pagination uses 20 items per page
3. **Group Limits:** Groups can have a maximum of 10 members and minimum of 2 members
4. **Authentication:** Cookies are HTTP-only and secure (SameSite: none, Secure: true)
5. **Real-time Updates:** Most chat operations trigger WebSocket events for real-time updates
6. **Message Status:** Messages have three statuses: "send" → "online" → "seen"
7. **Poll Support:** Messages can be polls with multiple options and voting
8. **Scheduled Messages:** Messages can be scheduled to send after a delay (in minutes)

