import { APP_DESCRIPTION, APP_NAME } from "@/lib/appBranding";

interface AppBrandNameProps {
  className?: string;
}

export default function AppBrandName({ className = "" }: AppBrandNameProps) {
  return (
    <span className={className} title={APP_DESCRIPTION}>
      {APP_NAME}
    </span>
  );
}
