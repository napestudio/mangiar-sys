import type { SerializedHomePageLink } from "@/actions/HomePageLinks";
import { getActiveHomePageLinks } from "@/actions/HomePageLinks";
import type { BusinessHoursPeriodData } from "@/actions/business-hours";
import { getBusinessHours } from "@/actions/business-hours";
import Avatar from "@/components/avatar";
import WhatsappIcon from "@/components/ui/icons/Whatsapp";
import { getPublicRestaurantAndBranch } from "@/lib/public-branch";
import { Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import MangiarFooter from "../mangiar-footer";

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

function groupByDay(periods: BusinessHoursPeriodData[]) {
  const map = new Map<string, BusinessHoursPeriodData[]>();
  for (const p of periods) {
    if (!map.has(p.dayOfWeek)) map.set(p.dayOfWeek, []);
    map.get(p.dayOfWeek)!.push(p);
  }
  return DAY_ORDER.filter((d) => map.has(d)).map((d) => ({
    day: d,
    label: DAY_LABELS[d] ?? d,
    periods: map.get(d)!,
  }));
}

function generateLinkUrl(link: SerializedHomePageLink): string {
  switch (link.type) {
    case "MENU":
      return link.menu?.slug ? `/carta/${link.menu.slug}` : "/";
    case "TIMESLOT":
      return "/reservas";
    case "RESERVATION":
      return "/reservas";
    case "PEDIDOS":
      return "/pedidos";
    case "CUSTOM":
      return link.customUrl || "#";
    default:
      return "/";
  }
}

export default async function RestaurantLandingPage() {
  const publicData = await getPublicRestaurantAndBranch();

  if (!publicData) {
    notFound();
  }

  const { restaurant, branchId } = publicData;

  const [linksResult, hoursResult] = await Promise.all([
    getActiveHomePageLinks(branchId),
    getBusinessHours(restaurant.id),
  ]);
  const links = linksResult.success && linksResult.data ? linksResult.data : [];
  const groupedHours = groupByDay(
    hoursResult.success && hoursResult.data ? hoursResult.data : [],
  );

  return (
    <>
      <div className="min-h-svh place-content-center bg-white text-neutral-900">
        <div className="max-w-120 p-8 pb-16 mx-auto px-8 md:px-0 flex justify-center flex-col items-center gap-9">
          <Avatar src={restaurant.logoUrl} alt={restaurant.name} />

          <div className="flex flex-col items-center justify-center gap-4 w-full">
            {links.map((link) => (
              <Link
                key={link.id}
                href={generateLinkUrl(link)}
                prefetch={true}
                className="bg-white text-red-500 border-2 hover:text-white border-red-500 group relative transition-colors rounded-md py-2 text-xl text-center font-bold uppercase w-full overflow-hidden"
              >
                <div className="absolute h-full w-full inset-0 bg-red-500 scale-y-0 group-focus:scale-y-100 group-hover:scale-y-100 origin-bottom transition-transform duration-500"></div>
                <div className="relative overflow-hidden w-max mx-auto">
                  <span className="inline-block group-focus:translate-y-14 group-focus:skew-12 group-hover:translate-y-14 group-hover:skew-12 transition-transform duration-500">
                    {link.label}
                  </span>
                  <span className="inline-block absolute left-0 -top-full skew-12 group-focus:skew-0 group-focus:translate-y-full group-hover:skew-0 group-hover:translate-y-full -translate-y-full transition-transform duration-500">
                    {link.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div>
            <h2 className="text-2xl leading-none font-bold text-center">
              {restaurant.name}
            </h2>
            <div className="text-center">
              <p className="text-lg">
                {restaurant.description || "Disfruta de nuestra comida"}
              </p>
              {groupedHours.length > 0 && (
                <div className="mt-4 mb-4 text-sm text-neutral-700">
                  <p className="flex items-center justify-center gap-1 font-semibold mb-2">
                    <Clock className="w-4 h-4" />
                    Horarios
                  </p>
                  <div className="space-y-1">
                    {groupedHours.map(({ day, label, periods }) => (
                      <div key={day} className="flex justify-between gap-8">
                        <span className="font-medium">{label}</span>
                        <span className="text-neutral-500">
                          {periods.map((p, i) => (
                            <span key={p.id}>
                              {i > 0 && " / "}
                              {p.openTime} – {p.closeTime}
                              {p.label && ` (${p.label})`}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {restaurant.address && (
                <Link
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.address}, ${restaurant.city}, ${restaurant.state}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MapPin className="inline-block mr-1 w-6 h-6" />
                  {restaurant.address}, {restaurant.city}, {restaurant.state}
                </Link>
              )}
              {restaurant.phone && (
                <p className="text-sm text-gray-400 mt-1">
                  <Link
                    href={`https://api.whatsapp.com/send/?phone=${restaurant.phone}&text=Hola!+Quisiera+hacer+una+consulta.&app_absent=0`}
                    className="flex items-center self-center justify-center"
                  >
                    <span className="inline-block mr-1 w-5 h-5">
                      <WhatsappIcon />
                    </span>
                    {restaurant.phone}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <MangiarFooter />
    </>
  );
}
