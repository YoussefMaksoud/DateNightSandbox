import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900 px-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            cardBox: "w-full",
          },
        }}
      />
    </div>
  );
}
