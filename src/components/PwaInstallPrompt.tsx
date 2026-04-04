import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [standalone, setStandalone] = useState(false);

  const isiOS = useMemo(() => /iphone|ipad|ipod/i.test(window.navigator.userAgent), []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setStandalone(mediaQuery.matches || iosStandalone);

    const onDisplayModeChange = (event: MediaQueryListEvent) => {
      setStandalone(event.matches || iosStandalone);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredPromptEvent);
    };

    mediaQuery.addEventListener("change", onDisplayModeChange);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      mediaQuery.removeEventListener("change", onDisplayModeChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const canShowPrompt = !standalone && !dismissed && (deferredPrompt !== null || isiOS);

  if (!canShowPrompt) {
    return null;
  }

  const installApp = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDismissed(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Install MEF TOEFL Test</p>
          {isiOS && !deferredPrompt ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Tap Share, then choose Add to Home Screen.
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Install the app for a faster launch and offline access.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setDismissed(true)}>
            Later
          </Button>
          {deferredPrompt && (
            <Button type="button" size="sm" onClick={installApp}>
              Install
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
