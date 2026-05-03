"use client";
import { Terminal } from "@/components/ui/terminal";

export default function TerminalDemo() {
  return (
    <section className="w-full py-2">
      <Terminal
        commands={[
          'mimic init --user "Alex"',
          "mimic train --source memories.json --voice samples/",
          'mimic deploy --avatar "Alex Prime"',
        ]}
        outputs={{
          0: [
            "Neural profile created for Alex.",
            "Identity graph initialized successfully.",
          ],
          1: [
            "Parsed 247 memories and 18 voice samples.",
            "Communication style confidence: 96.2%",
          ],
          2: ["Avatar Alex Prime is live.", "Secure share link generated."],
        }}
        typingSpeed={34}
        delayBetweenCommands={900}
        enableSound={false}
        className="shadow-2xl"
      />
    </section>
  );
}
