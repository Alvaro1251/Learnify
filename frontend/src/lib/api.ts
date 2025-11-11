const BASE_URL = "http://localhost:8000";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface ProfileUpdateRequest {
  full_name?: string;
  last_name?: string;
  career?: string;
  university?: string;
  birth_date?: string;
}

export interface UserProfile {
  email: string;
  id?: string;
  _id?: string;
  full_name?: string;
  last_name?: string;
  career?: string;
  university?: string;
  birth_date?: string;
  is_active: boolean;
  role?: string; // "user", "moderator", "admin"
  created_at: string;
}

export interface PostResponse {
  owner: string;
  content: string;
  creation_date: string;
}

export interface Post {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  subject: string;
  owner: string;
  creation_date: string;
  responses?: PostResponse[];
  responses_count?: number;
}

export interface CreatePostRequest {
  title: string;
  description: string;
  subject: string;
}

export interface AddResponseRequest {
  content: string;
}

export interface SharedFile {
  file_id: string;
  uploaded_by: string;
  file_url: string;
  uploaded_at: string;
}

export interface ChatMessage {
  sender: string;
  sender_name?: string;
  content: string;
  timestamp: string;
}

export interface Note {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  subject: string;
  university: string;
  career: string;
  tags: string[];
  file_url: string;
  file_name?: string;
  owner: string;
  likes?: string[];
  likes_count?: number;
  user_liked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteRequest {
  title: string;
  description: string;
  subject: string;
  university: string;
  career: string;
  tags: string[];
  file_url: string;
  file_name?: string;
}

export interface NotesFilters {
  university?: string;
  career?: string;
  subject?: string;
  tags?: string[];
  sort_by?: "recent" | "liked" | "oldest";
  page?: number;
  limit?: number;
}

export interface NotesPaginatedResponse {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface StudyGroup {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  owner: string;
  members: string[];
  member_ids: string[];
  pending_requests: string[];
  pending_request_ids: string[];
  files: SharedFile[];
  chat: ChatMessage[];
  is_public: boolean;
  exam_date: string;
  created_at: string;
  members_count?: number;
  files_count?: number;
  messages_count?: number;
}

export interface CreateStudyGroupRequest {
  name: string;
  description: string;
  is_public: boolean;
  exam_date: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: any,
    message?: string
  ) {
    super(message || "API Error");
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    console.error(`API Error [${response.status}]:`, data);
    
    // FastAPI validation errors return detail as an array of objects
    let errorMessage = "Request failed";
    if (data.detail) {
      if (Array.isArray(data.detail)) {
        // Format validation errors
        errorMessage = data.detail
          .map((err: any) => {
            const field = err.loc ? err.loc.join(".") : "campo";
            return `${field}: ${err.msg}`;
          })
          .join(", ");
      } else if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else {
        errorMessage = JSON.stringify(data.detail);
      }
    }
    
    throw new ApiError(response.status, data, errorMessage);
  }

  return data;
}

function transformPost(post: any): Post {
  return {
    ...post,
    id: post.id || post._id,
  };
}

function transformPosts(posts: any[]): Post[] {
  return posts.map(transformPost);
}

function transformStudyGroup(group: any): StudyGroup {
  return {
    ...group,
    id: group.id || group._id,
  };
}

function transformStudyGroups(groups: any[]): StudyGroup[] {
  return groups.map(transformStudyGroup);
}

function transformNote(note: any): Note {
  return {
    ...note,
    id: note.id || note._id,
    tags: Array.isArray(note.tags) ? note.tags : [],
  };
}

function transformNotes(notes: any[]): Note[] {
  return notes.map(transformNote);
}

function transformUserProfile(user: any): UserProfile {
  return {
    ...user,
    id: user.id || user._id,
  };
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log("Calling login with email:", credentials.email);
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    console.log("Login response status:", response.status);
    return handleResponse<LoginResponse>(response);
  },

  async register(credentials: RegisterRequest): Promise<LoginResponse> {
    console.log("Calling register with email:", credentials.email);
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    console.log("Register response status:", response.status);
    return handleResponse<LoginResponse>(response);
  },

  async getCurrentUser(token: string): Promise<UserProfile> {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse<any>(response);
    return transformUserProfile(data);
  },
};

export const profileApi = {
  async updateProfile(
    token: string,
    profile: ProfileUpdateRequest
  ): Promise<UserProfile> {
    console.log("Updating profile with token:", token.substring(0, 20) + "...");
    console.log("Profile data:", profile);

    const response = await fetch(`${BASE_URL}/profile/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });

    console.log("Profile update response status:", response.status);
    return handleResponse<UserProfile>(response);
  },

  async getMyProfile(token: string): Promise<UserProfile> {
    const response = await fetch(`${BASE_URL}/profile/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse<any>(response);
    return transformUserProfile(data);
  },
};

export interface UsersPaginatedResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export const adminApi = {
  async getAllUsers(
    token: string,
    params?: UsersQueryParams
  ): Promise<UsersPaginatedResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.role) queryParams.append("role", params.role);

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/auth/users${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse<any>(response);
    return {
      ...data,
      users: data.users.map(transformUserProfile),
    };
  },

  async updateUserRole(
    token: string,
    userId: string,
    role: "user" | "moderator" | "admin"
  ): Promise<UserProfile> {
    const response = await fetch(`${BASE_URL}/auth/users/${userId}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    const data = await handleResponse<any>(response);
    return transformUserProfile(data);
  },
};

export interface PostsPaginatedResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PostsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  subject?: string;
}

export const postsApi = {
  async getLatestPosts(
    params?: PostsQueryParams
  ): Promise<PostsPaginatedResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.subject) queryParams.append("subject", params.subject);

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/posts/latest${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
    });

    const data = await handleResponse<any>(response);
    return {
      ...data,
      posts: transformPosts(data.posts),
    };
  },

  async getPostDetails(postId: string): Promise<Post> {
    const response = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: "GET",
    });

    const data = await handleResponse<any>(response);
    return transformPost(data);
  },

  async createPost(
    token: string,
    data: CreatePostRequest
  ): Promise<Post> {
    const response = await fetch(`${BASE_URL}/posts/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const responseData = await handleResponse<any>(response);
    return transformPost(responseData);
  },

  async addResponse(
    token: string,
    postId: string,
    data: AddResponseRequest
  ): Promise<Post> {
    const response = await fetch(`${BASE_URL}/posts/${postId}/response`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const responseData = await handleResponse<any>(response);
    return transformPost(responseData);
  },

  async getMyPosts(token: string): Promise<Post[]> {
    const response = await fetch(`${BASE_URL}/posts/my/posts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse<any[]>(response);
    return transformPosts(data);
  },

  async deletePost(token: string, postId: string): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse<{ message: string }>(response);
  },
};

export interface StudyGroupsPaginatedResponse {
  groups: StudyGroup[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface StudyGroupsQueryParams {
  page?: number;
  limit?: number;
}

export const studyGroupsApi = {
  async getPublicStudyGroups(
    params?: StudyGroupsQueryParams,
    token?: string
  ): Promise<StudyGroupsPaginatedResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/study-groups/public${queryString ? `?${queryString}` : ""}`;

    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await handleResponse<any>(response);
    return {
      ...data,
      groups: transformStudyGroups(data.groups),
    };
  },

  async getStudyGroupDetails(groupId: string): Promise<StudyGroup> {
    const response = await fetch(`${BASE_URL}/study-groups/${groupId}`, {
      method: "GET",
    });

    const data = await handleResponse<any>(response);
    return transformStudyGroup(data);
  },

  async createStudyGroup(
    token: string,
    data: CreateStudyGroupRequest
  ): Promise<StudyGroup> {
    const response = await fetch(`${BASE_URL}/study-groups/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const responseData = await handleResponse<any>(response);
    return transformStudyGroup(responseData);
  },

  async joinStudyGroup(token: string, groupId: string): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/study-groups/${groupId}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse<{ message: string }>(response);
  },

  async leaveStudyGroup(token: string, groupId: string): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/study-groups/${groupId}/leave`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse<{ message: string }>(response);
  },

  async getMyStudyGroups(
    token: string,
    params?: StudyGroupsQueryParams
  ): Promise<StudyGroupsPaginatedResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const url = `${BASE_URL}/study-groups/my/groups${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse<any>(response);
    return {
      ...data,
      groups: transformStudyGroups(data.groups),
    };
  },

  async shareFile(
    token: string,
    groupId: string,
    fileUrl: string
  ): Promise<StudyGroup> {
    const response = await fetch(`${BASE_URL}/study-groups/${groupId}/share-file`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ file_url: fileUrl }),
    });

    const data = await handleResponse<any>(response);
    const groupData = data.group ?? data;
    return transformStudyGroup(groupData);
  },
};

function buildNotesQuery(filters: NotesFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.university) {
    params.append("university", filters.university);
  }
  if (filters.career) {
    params.append("career", filters.career);
  }
  if (filters.subject) {
    params.append("subject", filters.subject);
  }
  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach((tag) => {
      if (tag.trim().length > 0) {
        params.append("tags", tag.trim());
      }
    });
  }
  if (filters.sort_by) {
    params.append("sort_by", filters.sort_by);
  }
  if (filters.page) {
    params.append("page", filters.page.toString());
  }
  if (filters.limit) {
    params.append("limit", filters.limit.toString());
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const notesApi = {
  async searchNotes(filters: NotesFilters = {}): Promise<NotesPaginatedResponse> {
    const query = buildNotesQuery(filters);
    const response = await fetch(`${BASE_URL}/notes/${query}`, {
      method: "GET",
    });

    const data = await handleResponse<any>(response);
    return {
      ...data,
      notes: transformNotes(data.notes),
    };
  },

  async getLatestNotes(): Promise<Note[]> {
    const response = await fetch(`${BASE_URL}/notes/latest/notes`, {
      method: "GET",
    });

    const data = await handleResponse<any[]>(response);
    return transformNotes(data);
  },

  async getMostLikedNotes(limit: number = 10, token?: string): Promise<Note[]> {
    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    const response = await fetch(`${BASE_URL}/notes/most-liked?limit=${limit}`, {
      method: "GET",
      headers,
    });

    const data = await handleResponse<any[]>(response);
    return transformNotes(data);
  },

  async getNoteDetails(noteId: string, token?: string): Promise<Note> {
    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    const response = await fetch(`${BASE_URL}/notes/${noteId}`, {
      method: "GET",
      headers,
    });

    const data = await handleResponse<any>(response);
    return transformNote(data);
  },

  async toggleLike(token: string, noteId: string): Promise<Note> {
    const response = await fetch(`${BASE_URL}/notes/${noteId}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse<any>(response);
    return transformNote(data);
  },

  async createNote(
    token: string,
    request: CreateNoteRequest
  ): Promise<Note> {
    const response = await fetch(`${BASE_URL}/notes/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    const data = await handleResponse<any>(response);
    return transformNote(data);
  },

  async getMyNotes(token: string): Promise<Note[]> {
    const response = await fetch(`${BASE_URL}/notes/my/notes`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse<any[]>(response);
    return transformNotes(data);
  },

  async deleteNote(
    token: string,
    noteId: string
  ): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/notes/${noteId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse<{ message: string }>(response);
  },
};
