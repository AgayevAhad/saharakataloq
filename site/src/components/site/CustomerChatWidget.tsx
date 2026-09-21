import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, MessageCircle, Mic, Send, Square, X } from 'lucide-react';
import { AuthUser } from '../../types/auth';
import { ShimmerImage } from '../ShimmerImage';
import { customerSupportApi, SupportMessage } from '../../services/customerSupportApi';

interface CustomerChatWidgetProps {
  user: AuthUser | null;
  onOpenAccount: () => void;
}

export const CustomerChatWidget: React.FC<CustomerChatWidgetProps> = ({ user, onOpenAccount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [introActive, setIntroActive] = useState(true);
  const [helperLeaving, setHelperLeaving] = useState(false);
  const [showHelper, setShowHelper] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    let active = true;
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const next = await customerSupportApi.messages();
        if (active) {
          setMessages(next);
          setError('');
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Mesajlar yüklənmədi');
      } finally {
        if (active) setLoading(false);
      }
    };
    setLoading(true);
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, isOpen]);

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

  // Intro animation: 1.5s center hold -> glide to bottom right -> speech bubble animates away over 1.5s
  useEffect(() => {
    const introTimer = window.setTimeout(() => setIntroActive(false), 2600);
    const leaveTimer = window.setTimeout(() => setHelperLeaving(true), 2700);
    const dismissTimer = window.setTimeout(() => setShowHelper(false), 4300);
    return () => {
      window.clearTimeout(introTimer);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(dismissTimer);
    };
  }, []);

  const sendText = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      const message = await customerSupportApi.sendMessage(body);
      setMessages((prev) => [...prev, message]);
      setDraft('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Mesaj göndərilmədi');
    } finally {
      setSending(false);
    }
  };

  const sendFile = async (file?: Blob) => {
    if (!file || sending) return;
    setSending(true);
    setError('');
    try {
      const message = await customerSupportApi.sendAttachment(file);
      setMessages((prev) => [...prev, message]);
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
      recordTimerRef.current = window.setTimeout(() => recorder.stop(), 60_000);
    } catch {
      setError('Mikrofona icazə verilmədi.');
    }
  };

  return (
    <div className={`customer-chat-widget ${introActive && !hasInteracted ? 'is-intro' : ''}`}>
      {!isOpen && !hasInteracted && showHelper && (
        <div
          className={`customer-chat-helper ${helperLeaving ? 'is-leaving' : ''}`}
          aria-hidden="true"
        >
          <span>Sualınız var? Bura yazın.</span>
        </div>
      )}
      <button
        type="button"
        className="customer-chat-trigger"
        onClick={() => {
          setHasInteracted(true);
          user ? setIsOpen((value) => !value) : onOpenAccount();
        }}
        aria-label={user ? 'Saytdaxili çatı aç' : 'Çat üçün hesabınıza daxil olun'}
      >
        <MessageCircle size={24} aria-hidden="true" />
      </button>
      {isOpen && user && (
        <section className="customer-chat-panel" role="dialog" aria-label="Sahara saytdaxili çat">
          <header>
            <div>
              <strong>Saytdaxili dəstək</strong>
              <small>Mesajlarınız yalnız sizin hesabınıza bağlıdır</small>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Çatı bağla">
              <X size={18} />
            </button>
          </header>
          <div className="customer-chat-messages" ref={listRef} aria-live="polite">
            {loading && (
              <div className="skeleton-box customer-chat-skeleton" aria-label="Mesajlar yüklənir" />
            )}
            {!loading && messages.length === 0 && (
              <p className="customer-chat-empty">
                Sualınızı və ya sifarişlə bağlı məlumatı yazın. Cavablar burada görünəcək.
              </p>
            )}
            {messages.map((message) => (
              <article key={message.id} className={`customer-chat-message is-${message.sender}`}>
                {message.body && <p>{message.body}</p>}
                {message.kind === 'image' && message.attachmentId && (
                  <ShimmerImage
                    src={customerSupportApi.attachmentUrl(message.attachmentId)}
                    alt="Çat şəkli"
                    objectFit="contain"
                    containerStyle={{ width: '100%', height: 180 }}
                  />
                )}
                {message.kind === 'audio' && message.attachmentId && (
                  <audio
                    controls
                    preload="none"
                    src={customerSupportApi.attachmentUrl(message.attachmentId)}
                    aria-label="Səsli mesaj"
                  />
                )}
                <time dateTime={message.createdAt}>
                  {new Date(message.createdAt).toLocaleTimeString('az-AZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </article>
            ))}
          </div>
          {error && (
            <p className="customer-chat-error" role="alert">
              {error}
            </p>
          )}
          <form className="customer-chat-composer" onSubmit={sendText}>
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
              aria-label="Şəkil göndər"
            >
              <ImagePlus size={19} />
            </button>
            <button
              type="button"
              onClick={() => void toggleRecording()}
              disabled={sending}
              aria-label={recording ? 'Səs yazısını dayandır' : 'Səs yaz'}
            >
              {recording ? <Square size={18} /> : <Mic size={19} />}
            </button>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Mesajınızı yazın..."
              maxLength={3000}
              aria-label="Çat mesajı"
            />
            <button type="submit" disabled={!draft.trim() || sending} aria-label="Mesajı göndər">
              <Send size={19} />
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
