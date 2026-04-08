import Avatar from "@/components/avatar";
import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-svh place-content-center bg-white text-neutral-900 relative overflow-hidden">
      {/* Deco */}
      <div className="max-w-100 mx-auto px-8 md:px-0 flex justify-center flex-col items-center gap-9">
        <div className="px-12 w-full">
          <Avatar />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
