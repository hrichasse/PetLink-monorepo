import type { NextPageContext } from "next";

type AuthErrorPageProps = {
  statusCode: number;
};

function AuthErrorPage({ statusCode }: AuthErrorPageProps) {
  const title = statusCode === 404 ? "Resource not found." : "Internal server error.";

  return (
    <main>
      <h1>{statusCode}</h1>
      <p>{title}</p>
    </main>
  );
}

AuthErrorPage.getInitialProps = ({ res, err }: NextPageContext): AuthErrorPageProps => {
  if (res?.statusCode) {
    return { statusCode: res.statusCode };
  }

  if (err && "statusCode" in err && typeof err.statusCode === "number") {
    return { statusCode: err.statusCode };
  }

  return { statusCode: 500 };
};

export default AuthErrorPage;