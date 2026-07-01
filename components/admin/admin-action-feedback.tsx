"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type ActionKind = "loading" | "upload";
type ActionStatus = "loading" | "success" | "error";

type AdminAction = {
  id: string;
  title: string;
  message?: string;
  type: ActionKind;
  progress: number | null;
  status: ActionStatus;
};

type StartActionInput = {
  id?: string;
  title: string;
  message?: string;
  type?: ActionKind;
  progress?: number | null;
};

type UpdateActionInput = Partial<Pick<AdminAction, "title" | "message" | "progress">>;
type FinishActionInput = Pick<AdminAction, "title" | "message"> & { status: "success" | "error" };

type AdminActionFeedbackContextValue = {
  startAction: (input: StartActionInput) => string;
  updateAction: (id: string, input: UpdateActionInput) => void;
  finishAction: (id: string, input: FinishActionInput) => void;
  finishLatestAction: (input: FinishActionInput) => void;
  dismissAction: (id: string) => void;
  notifySuccess: (title: string, message?: string) => string;
  notifyError: (title: string, message?: string) => string;
  notifyLoading: (title: string, message?: string) => string;
};

const AdminActionFeedbackContext = createContext<AdminActionFeedbackContextValue | null>(null);

function actionId() {
  return globalThis.crypto?.randomUUID?.() ?? `admin-action-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function pendingTitle(button: HTMLButtonElement | HTMLInputElement | null) {
  const explicit = button?.dataset.adminFeedbackTitle?.trim();
  if (explicit) return explicit;

  const label = button?.dataset.adminPendingLabel?.trim() || button?.textContent?.trim() || button?.value?.trim() || "Submitting";
  if (/delet/i.test(label)) return label.replace(/delete|deleting/i, "Deleting").replace(/\.*$/, "...");
  if (/publish/i.test(label)) return label.replace(/publish|publishing/i, "Publishing").replace(/\.*$/, "...");
  if (/upload/i.test(label)) return label.replace(/upload|uploading/i, "Uploading").replace(/\.*$/, "...");
  if (/add|create/i.test(label)) return label.replace(/add|adding|create|creating/i, "Adding").replace(/\.*$/, "...");
  if (/save|update/i.test(label)) return label.replace(/save|saving|update|updating/i, "Saving").replace(/\.*$/, "...");
  return `${label.replace(/\.*$/, "")}...`;
}

export function AdminActionFeedbackProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const dismissTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissAction = useCallback((id: string) => {
    const timer = dismissTimers.current.get(id);
    if (timer) clearTimeout(timer);
    dismissTimers.current.delete(id);
    setActions((current) => current.filter((action) => action.id !== id));
  }, []);

  const startAction = useCallback((input: StartActionInput) => {
    const id = input.id ?? actionId();
    setActions((current) => [
      ...current.filter((action) => action.id !== id),
      {
        id,
        title: input.title,
        message: input.message,
        type: input.type ?? "loading",
        progress: input.progress ?? null,
        status: "loading"
      }
    ]);
    return id;
  }, []);

  const updateAction = useCallback((id: string, input: UpdateActionInput) => {
    setActions((current) => current.map((action) => action.id === id ? { ...action, ...input } : action));
  }, []);

  const finishAction = useCallback((id: string, input: FinishActionInput) => {
    setActions((current) => current.map((action) => action.id === id
      ? { ...action, ...input, progress: null, status: input.status }
      : action));

    if (input.status === "success") {
      const previous = dismissTimers.current.get(id);
      if (previous) clearTimeout(previous);
      dismissTimers.current.set(id, setTimeout(() => dismissAction(id), 3800));
    }
  }, [dismissAction]);

  const finishLatestAction = useCallback((input: FinishActionInput) => {
    setActions((current) => {
      const latest = [...current].reverse().find((action) => action.status === "loading");
      if (!latest) {
        const id = actionId();
        if (input.status === "success") {
          dismissTimers.current.set(id, setTimeout(() => dismissAction(id), 3800));
        }
        return [...current, { id, ...input, type: "loading", progress: null, status: input.status }];
      }

      if (input.status === "success") {
        const previous = dismissTimers.current.get(latest.id);
        if (previous) clearTimeout(previous);
        dismissTimers.current.set(latest.id, setTimeout(() => dismissAction(latest.id), 3800));
      }

      return current.map((action) => action.id === latest.id
        ? { ...action, ...input, progress: null, status: input.status }
        : action);
    });
  }, [dismissAction]);

  const notifyLoading = useCallback((title: string, message?: string) => startAction({ title, message }), [startAction]);
  const notifySuccess = useCallback((title: string, message?: string) => {
    const id = startAction({ title, message });
    finishAction(id, { title, message, status: "success" });
    return id;
  }, [finishAction, startAction]);
  const notifyError = useCallback((title: string, message?: string) => {
    const id = startAction({ title, message });
    finishAction(id, { title, message, status: "error" });
    return id;
  }, [finishAction, startAction]);

  const value = useMemo(() => ({
    startAction,
    updateAction,
    finishAction,
    finishLatestAction,
    dismissAction,
    notifySuccess,
    notifyError,
    notifyLoading
  }), [dismissAction, finishAction, finishLatestAction, notifyError, notifyLoading, notifySuccess, startAction, updateAction]);

  useEffect(() => {
    function onSubmit(event: SubmitEvent) {
      const button = event.submitter instanceof HTMLButtonElement || event.submitter instanceof HTMLInputElement ? event.submitter : null;
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        if (button?.dataset.adminFeedbackManaged === "true") return;
        startAction({ title: pendingTitle(button) });
      });
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const candidates = mutation.type === "childList"
          ? Array.from(mutation.addedNodes).flatMap((node) => node instanceof Element ? [node, ...node.querySelectorAll(".admin-alert, .auth-error, .auth-note, .form-status")] : [])
          : mutation.target instanceof Element ? [mutation.target] : [];

        for (const candidate of candidates) {
          if (!(candidate instanceof HTMLElement) || candidate.dataset.adminFeedbackHandled === "true" || candidate.dataset.adminFeedbackIgnore === "true") continue;
          const alert = candidate.matches(".admin-alert, .auth-error, .auth-note, .form-status")
            ? candidate
            : candidate.closest(".admin-alert, .auth-error, .auth-note, .form-status");
          const message = alert?.textContent?.trim();
          if (!alert || !message || (alert instanceof HTMLElement && alert.dataset.adminFeedbackIgnore === "true")) continue;
          const isError = alert.classList.contains("admin-alert--error") || alert.classList.contains("auth-error") || alert.classList.contains("error");
          finishLatestAction({ title: message, status: isError ? "error" : "success" });
          return;
        }
      }
    });

    document.addEventListener("submit", onSubmit);
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    const timers = dismissTimers.current;
    return () => {
      document.removeEventListener("submit", onSubmit);
      observer.disconnect();
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [finishLatestAction, startAction]);

  const activeAction = [...actions].reverse().find((action) => action.status === "loading");
  const visibleActions = actions.slice(-3);

  return (
    <AdminActionFeedbackContext.Provider value={value}>
      {children}
      {activeAction ? (
        <div className="admin-progress-bar" role="progressbar" aria-label={activeAction.title} aria-valuenow={activeAction.progress ?? undefined}>
          <span
            className={`admin-progress-bar__fill${activeAction.progress === null ? " admin-progress-bar__fill--indeterminate" : ""}`}
            style={activeAction.progress === null ? undefined : { width: `${Math.max(0, Math.min(100, activeAction.progress))}%` }}
          />
        </div>
      ) : null}
      <div className="admin-toast-stack" aria-live="polite" aria-relevant="additions text">
        {visibleActions.map((action) => (
          <article className={`admin-toast admin-toast--${action.status}`} key={action.id}>
            <span className="admin-toast__accent" aria-hidden="true" />
            <span className="admin-toast__icon" aria-hidden="true">
              {action.status === "loading" ? <LoaderCircle /> : action.status === "success" ? <CheckCircle2 /> : <AlertCircle />}
            </span>
            <span className="admin-toast__content">
              <strong className="admin-toast__title">{action.title}</strong>
              {action.message ? <span className="admin-toast__message">{action.message}</span> : null}
            </span>
            {action.status === "error" ? (
              <button className="admin-toast__close" type="button" onClick={() => dismissAction(action.id)} aria-label="Dismiss notification">
                <X />
              </button>
            ) : null}
            {action.status === "success" ? <span className="admin-toast__timer" aria-hidden="true" /> : null}
          </article>
        ))}
      </div>
    </AdminActionFeedbackContext.Provider>
  );
}

export function useAdminActionFeedback() {
  const value = useContext(AdminActionFeedbackContext);
  if (!value) throw new Error("useAdminActionFeedback must be used inside AdminActionFeedbackProvider.");
  return value;
}
