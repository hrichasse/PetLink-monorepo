import type { NextPageContext } from "next";

type MarketplaceErrorPageProps = {
  statusCode: number;
};

function MarketplaceErrorPage({ statusCode }: MarketplaceErrorPageProps) {
  const title = statusCode === 404 ? "Resource not found." : "Internal server error.";

  return (
    <main>
      <h1>{statusCode}</h1>
      <p>{title}</p>
    </main>
  );
}

MarketplaceErrorPage.getInitialProps = ({ res, err }: NextPageContext): MarketplaceErrorPageProps => {
  if (res?.statusCode) {
    return { statusCode: res.statusCode };
  }

  if (err && "statusCode" in err && typeof err.statusCode === "number") {
    return { statusCode: err.statusCode };
  }

  return { statusCode: 500 };
};

export default MarketplaceErrorPage;
