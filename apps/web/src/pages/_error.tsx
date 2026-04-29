import type { NextPageContext } from "next";

type WebErrorPageProps = {
  statusCode: number;
};

function WebErrorPage({ statusCode }: WebErrorPageProps) {
  const title = statusCode === 404 ? "Resource not found." : "Internal server error.";

  return (
    <main>
      <h1>{statusCode}</h1>
      <p>{title}</p>
    </main>
  );
}

WebErrorPage.getInitialProps = ({ res, err }: NextPageContext): WebErrorPageProps => {
  if (res?.statusCode) {
    return { statusCode: res.statusCode };
  }

  if (err && "statusCode" in err && typeof err.statusCode === "number") {
    return { statusCode: err.statusCode };
  }

  return { statusCode: 500 };
};

export default WebErrorPage;
