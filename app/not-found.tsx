import ErrorLayout from "@/components/error-layout";

const NotFound = () => (
  <ErrorLayout
    title="Page not found"
    description="The page you are looking for does not exist."
    action={{ type: "link", href: "/", label: "Go home" }}
  />
);

export default NotFound;
