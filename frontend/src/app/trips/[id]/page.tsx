import { TripDetail } from "./trip-detail";

type Props = { params: Promise<{ id: string }> };

export default async function TripPage({ params }: Props) {
  const { id } = await params;
  return <TripDetail id={id} />;
}
