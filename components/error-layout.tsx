import Link from "next/link";

const buttonClassName =
  "cursor-pointer inline-block mt-8 text-sm font-medium bg-neutral-800 dark:bg-white text-neutral-100 dark:text-neutral-900 px-4 py-2 rounded-full active:scale-95 transition-transform";

const ErrorLayout = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action:
    | { type: "link"; href: string; label: string }
    | { type: "button"; onClick: () => void; label: string };
}) => (
  <div className="min-h-svh flex items-center justify-center p-5 sm:p-10">
    <div className="text-center text-pretty">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
      {action.type === "link" ? (
        <Link href={action.href} className={buttonClassName}>
          {action.label}
        </Link>
      ) : (
        <button
          type="button"
          onClick={action.onClick}
          className={buttonClassName}
        >
          {action.label}
        </button>
      )}
    </div>
  </div>
);

export default ErrorLayout;
