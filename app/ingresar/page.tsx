import Avatar from "@/components/avatar";
import LoginForm from "@/components/ingresar-form";

export default function LoginPage() {
  return (
    <div className="min-h-svh place-content-center bg-white text-neutral-900">
      <div className="max-w-100 mx-auto px-8 md:px-0 flex justify-center flex-col items-center gap-9">
        <Avatar />
        <LoginForm />
      </div>
    </div>
  );
}
