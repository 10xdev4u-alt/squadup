const STEPS = [
  {
    step: "01",
    title: "Discover teammates",
    description:
      "Sign in with your college email, set your role and skills, and start swiping through the deck.",
  },
  {
    step: "02",
    title: "Match and chat",
    description:
      "When you both swipe right, you match. Open the chat, feel it out, and agree to build together.",
  },
  {
    step: "03",
    title: "Build together",
    description:
      "Form a team around a problem statement, share the invite code, and run the build from the workspace.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border py-16">
      <h2 className="text-center font-display text-3xl font-bold tracking-tight">
        How it works
      </h2>
      <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
        Three steps from solo to shipping.
      </p>
      <ol className="mx-auto mt-10 grid max-w-4xl gap-8 sm:grid-cols-3">
        {STEPS.map((item) => (
          <li key={item.step} className="text-center">
            <span className="font-display text-sm font-semibold text-primary">
              {item.step}
            </span>
            <h3 className="mt-2 font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
