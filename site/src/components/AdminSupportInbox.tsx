import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, MessageCircle, Mic, Send, Square } from 'lucide-react';
import { ThemeColors } from '../types/theme';
import {
  customerSupportApi,
  SupportConversation,
  SupportMessage,
} from '../services/customerSupportApi';
import { ShimmerImage } from './ShimmerImage';

interface Props {
  theme: ThemeColors;
  csrfToken: string;
}

export const AdminSupportInbox: React.FC<Props> = ({ theme, csrfToken }) => {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (recordTimerRef.current) window.clearTimeout(recordTimerRef.current);
      if (recorderRef.current) {
        recorderRef.current.onstop = null;
        recorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    },
    []
  );

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const [inbox, thread] = await Promise.all([
          customerSupportApi.adminInbox(),
          selectedId ? customerSupportApi.adminMessages(selectedId) : Promise.resolve([]),
        ]);
        if (active) {
          setConversations(inbox);
          if (selectedId) setMessages(thread);
          setError('');
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Çat yüklənmədi');
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selectedId]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!selectedId || !body || sending) return;
    setSending(true);
    try {
      const message = await customerSupportApi.adminSendMessage(selectedId, body, csrfToken);
      setMessages((prev) => [...prev, message]);
      setDraft('');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Cavab göndərilmədi');
    } finally {
      setSending(false);
    }
  };

  const sendFile = async (file?: Blob) => {
    if (!selectedId || !file || sending) return;
    setSending(true);
    try {
      const message = await customerSupportApi.adminSendAttachment(selectedId, file, csrfToken);
      setMessages((prev) => [...prev, message]);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Fayl göndərilmədi');
    } finally {
      setSending(false);
    }
  };

  const toggleRecording = async () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      setRecording(false);
      if (recordTimerRef.current) window.clearTimeout(recordTimerRef.current);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Bu brauzerdə səs yazısı dəstəklənmir.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((type) =>
        MediaRecorder.isTypeSupported(type)
      );
      if (!mimeType) {
        stream.getTracks().forEach((track) => track.stop());
        setError('Uyğun səs formatı tapılmadı.');
        return;
      }
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        setRecording(false);
        void sendFile(new Blob(chunks, { type: mimeType }));
      };
      recorder.start();
      setRecording(true);
      recordTimerRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 60_000);
    } catch {
      setError('Mikrofona icazə verilmədi.');
    }
  };

  return (
    <section
      className="admin-support-inbox"
      style={{ background: theme.bgCard, color: theme.text, borderColor: theme.border }}
      aria-label="Müştəri çatları"
    >
      <div className="admin-support-list">
        <h2>
          <MessageCircle size={20} /> Müştəri çatları
        </h2>
        {loading && (
          <div
            className="skeleton-box"
            style={{ height: 58, borderRadius: 12 }}
            aria-label="Çatlar yüklənir"
          />
        )}
        {!loading && conversations.length === 0 && <p>Hələ heç bir müştəri mesajı yoxdur.</p>}
        {conversations.map((conversation) => (
          <button
            type="button"
            key={conversation.userId}
            className={selectedId === conversation.userId ? 'is-active' : ''}
            onClick={() => setSelectedId(conversation.userId)}
          >
            <strong>{conversation.fullName}</strong>
            <small>{conversation.phone}</small>
            <span>{conversation.lastMessage || 'Media mesajı'}</span>
            {conversation.unreadCount > 0 && (
              <b aria-label={`${conversation.unreadCount} oxunmamış mesaj`}>
                {conversation.unreadCount}
              </b>
            )}
          </button>
        ))}
      </div>
      <div className="admin-support-thread">
        {selectedId ? (
          <>
            <h3>
              {conversations.find((entry) => entry.userId === selectedId)?.fullName || 'Müştəri'}
            </h3>
            <div className="admin-support-messages" aria-live="polite">
              {messages.map((message) => (
                <article key={message.id} className={`customer-chat-message is-${message.sender}`}>
                  {message.body && <p>{message.body}</p>}
                  {message.kind === 'image' && message.attachmentId && (
                    <ShimmerImage
                      src={customerSupportApi.attachmentUrl(message.attachmentId)}
                      alt="Müştərinin göndərdiyi şəkil"
                      objectFit="contain"
                      containerStyle={{ width: '100%', height: 180 }}
                    />
                  )}
                  {message.kind === 'audio' && message.attachmentId && (
                    <audio
                      controls
                      preload="none"
                      src={customerSupportApi.attachmentUrl(message.attachmentId)}
                      aria-label="Müştərinin səsli mesajı"
                    />
                  )}
                  <time dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleString('az-AZ')}
                  </time>
                </article>
              ))}
            </div>
            <form className="admin-support-compose" onSubmit={send}>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(event) => {
                  void sendFile(event.target.files?.[0]);
                  event.currentTarget.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={sending}
                aria-label="Müştəriyə şəkil göndər"
              >
                <ImagePlus size={17} />
              </button>
              <button
                type="button"
                onClick={() => void toggleRecording()}
                disabled={sending}
                aria-label={recording ? 'Səs yazısını dayandır' : 'Müştəriyə səs yaz'}
              >
                {recording ? <Square size={17} /> : <Mic size={17} />}
              </button>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={3000}
                placeholder="Müştəriyə cavab yazın..."
                aria-label="Müştəriyə cavab"
              />
              <button type="submit" disabled={!draft.trim() || sending}>
                <Send size={17} /> Göndər
              </button>
            </form>
          </>
        ) : (
          <p className="admin-support-placeholder">Yazışmanı görmək üçün soldan müştəri seçin.</p>
        )}
        {error && (
          <p role="alert" className="customer-chat-error">
            {error}
          </p>
        )}
      </div>
    </section>
  );
};
