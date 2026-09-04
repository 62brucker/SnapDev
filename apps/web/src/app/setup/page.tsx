import { SetupClient } from "./setup-client";

type SetupPageProps = {
  searchParams: Promise<{ connection?: string; session?: string }>;
};

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const params = await searchParams;
  return <SetupClient connection={params.connection ?? ""} session={params.session ?? ""} />;
}
