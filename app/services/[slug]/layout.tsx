import type { Metadata } from "next";
import { ALL_SERVICES, getServiceKeyword } from "../../services-config";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const matchedService = ALL_SERVICES.find((s) => s.slug === slug);
  const name = matchedService ? matchedService.name : "Home Service";
  const desc = matchedService ? matchedService.desc : "Premium home service and repairs in Hosur.";
  
  const mainKeyword = matchedService ? getServiceKeyword(matchedService.name) : `${name} works in Hosur`;
  
  return {
    title: `${name} Works in Hosur - Premium Doorstep Service | AtoZ Works`,
    description: `Book background-verified professional specialists for ${name.toLowerCase()} works in Hosur. ${desc} Transparent pricing, same-day booking, and 100% satisfaction warranty.`,
    keywords: [
      mainKeyword,
      `${name} works in Hosur`,
      `${name} service in Hosur`,
      `${name.toLowerCase()} works in Hosur`,
      `${name.toLowerCase()} service in Hosur`,
      `${name.toLowerCase()} mechanic in Hosur`,
      `best ${name.toLowerCase()} in Hosur`,
      `local ${name.toLowerCase()} services Hosur`,
      "AtoZ Works Hosur",
      "home services Hosur"
    ],
  };
}

export default function ServiceLayout({ children }: Props) {
  return <>{children}</>;
}
