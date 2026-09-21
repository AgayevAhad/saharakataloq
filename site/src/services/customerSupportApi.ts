import { AuthUser, LoginCredentials, RegisterCredentials } from '../types/auth';

export interface SupportMessage {
  id: string;
  userId: string;
  sender: 'customer' | 'admin';
  kind: 'text' | 'image' | 'audio';
  body: string;
  attachmentId: string | null;
  createdAt: string;
  seenAt: string | null;
}

export interface SupportConversation {
  userId: string;
  fullName: string;
  phone: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}

let customerCsrfToken: string | null = null;

const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Sorğu yerinə yetirilmədi');
  return data as T;
};

const jsonBody = (value: unknown, csrfToken?: string): RequestInit => ({
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
  },
  body: JSON.stringify(value),
});

export const customerSupportApi = {
  async session(): Promise<AuthUser | null> {
    const data = await request<{ user: AuthUser | null; csrfToken: string | null }>(
      '/api/customer/session'
    );
    customerCsrfToken = data.csrfToken;
    return data.user;
  },
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const data = await request<{ user: AuthUser; csrfToken: string }>(
      '/api/customer/login',
      jsonBody(credentials)
    );
    customerCsrfToken = data.csrfToken;
    return data.user;
  },
  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    const data = await request<{ user: AuthUser; csrfToken: string }>(
      '/api/customer/register',
      jsonBody(credentials)
    );
    customerCsrfToken = data.csrfToken;
    return data.user;
  },
  async logout(): Promise<void> {
    await request('/api/customer/logout', jsonBody({}, customerCsrfToken || ''));
    customerCsrfToken = null;
  },
  async updateProfile(user: AuthUser): Promise<AuthUser> {
    const data = await request<{ user: AuthUser }>('/api/customer/profile', {
      ...jsonBody(
        { fullName: user.fullName, email: user.email, birthDate: user.birthDate },
        customerCsrfToken || ''
      ),
      method: 'PATCH',
    });
    return data.user;
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await request(
      '/api/customer/password',
      jsonBody({ currentPassword, newPassword }, customerCsrfToken || '')
    );
  },
  async messages(): Promise<SupportMessage[]> {
    const data = await request<{ messages: SupportMessage[] }>('/api/chat/messages');
    return data.messages;
  },
  async sendMessage(body: string): Promise<SupportMessage> {
    const data = await request<{ message: SupportMessage }>(
      '/api/chat/messages',
      jsonBody({ body }, customerCsrfToken || '')
    );
    return data.message;
  },
  async sendAttachment(file: Blob): Promise<SupportMessage> {
    const data = await request<{ message: SupportMessage }>('/api/chat/attachment', {
      method: 'POST',
      headers: { 'Content-Type': file.type, 'X-CSRF-Token': customerCsrfToken || '' },
      body: file,
    });
    return data.message;
  },
  async adminInbox(): Promise<SupportConversation[]> {
    const data = await request<{ conversations: SupportConversation[] }>('/api/admin/chat/inbox');
    return data.conversations;
  },
  async adminMessages(userId: string): Promise<SupportMessage[]> {
    const data = await request<{ messages: SupportMessage[] }>(
      `/api/admin/chat/${encodeURIComponent(userId)}/messages`
    );
    return data.messages;
  },
  async adminSendMessage(userId: string, body: string, csrfToken: string): Promise<SupportMessage> {
    const data = await request<{ message: SupportMessage }>(
      `/api/admin/chat/${encodeURIComponent(userId)}/messages`,
      jsonBody({ body }, csrfToken)
    );
    return data.message;
  },
  async adminSendAttachment(
    userId: string,
    file: Blob,
    csrfToken: string
  ): Promise<SupportMessage> {
    const data = await request<{ message: SupportMessage }>(
      `/api/admin/chat/${encodeURIComponent(userId)}/attachment`,
      {
        method: 'POST',
        headers: { 'Content-Type': file.type, 'X-CSRF-Token': csrfToken },
        body: file,
      }
    );
    return data.message;
  },
  attachmentUrl(id: string): string {
    return `/api/chat/attachments/${encodeURIComponent(id)}`;
  },
};
