import { Link } from "react-router";

function Error({ message }: { message: string }) {
  return (
    <>
      <h1 className="text-6xl font-semibold">{message}</h1>
      <Link
        className="text-xl font-medium text-deca-blue hover:underline"
        to="/"
      >
        Go Home
      </Link>
    </>
  );
}

export default Error;
