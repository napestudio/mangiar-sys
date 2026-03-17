import type { SerializedHomePageLink } from "@/actions/HomePageLinks";
import { getActiveHomePageLinks } from "@/actions/HomePageLinks";
import type { BusinessHoursPeriodData } from "@/actions/business-hours";
import { getBusinessHours } from "@/actions/business-hours";
import Avatar from "@/components/avatar";
import LandingThemeProvider from "@/components/landing/theme-provider";
import FacebookIcon from "@/components/ui/icons/Facebook";
import InstagramIcon from "@/components/ui/icons/Instagram";
import LinkedInIcon from "@/components/ui/icons/LinkedIn";
import TikTokIcon from "@/components/ui/icons/TikTok";
import TwitterIcon from "@/components/ui/icons/Twitter";
import WhatsappIcon from "@/components/ui/icons/Whatsapp";
import { getPublicRestaurantAndBranch } from "@/lib/public-branch";
import { Clock, Globe, MapPin } from "lucide-react";
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

  const { restaurant, branchId, theme } = publicData;

  const [linksResult, hoursResult] = await Promise.all([
    getActiveHomePageLinks(branchId),
    getBusinessHours(restaurant.id),
  ]);
  const links = linksResult.success && linksResult.data ? linksResult.data : [];
  const groupedHours = groupByDay(
    hoursResult.success && hoursResult.data ? hoursResult.data : [],
  );

  // Button classes change based on variant (solid fills immediately, outline does the slide-in animation)
  const isOutline = theme.buttonVariant === "outline";

  return (
    <>
      <LandingThemeProvider theme={theme} />
      <div
        className="min-h-svh place-content-center"
        style={{
          backgroundColor: "var(--rt-bg)",
          color: "var(--rt-text)",
          fontFamily: "var(--rt-font)",
        }}
      >
        <div className="max-w-120 p-8 pb-16 mx-auto px-8 md:px-0 flex justify-center flex-col items-center gap-9">
          <Avatar src={restaurant.logoUrl} alt={restaurant.name} />

          <div className="flex flex-col items-center justify-center gap-4 w-full">
            {links.map((link) =>
              isOutline ? (
                <Link
                  key={link.id}
                  href={generateLinkUrl(link)}
                  prefetch={true}
                  className="group relative transition-colors py-2 text-xl text-center font-bold uppercase w-full overflow-hidden border-2"
                  style={{
                    borderRadius: "var(--rt-btn-radius)",
                    borderColor: "var(--rt-primary)",
                    color: "var(--rt-primary)",
                    backgroundColor: "var(--rt-bg)",
                  }}
                >
                  {/* slide-in fill on hover */}
                  <div
                    className="absolute h-full w-full inset-0 scale-y-0 group-focus:scale-y-100 group-hover:scale-y-100 origin-bottom transition-transform duration-500"
                    style={{ backgroundColor: "var(--rt-primary)" }}
                  />
                  <div className="relative overflow-hidden w-max mx-auto">
                    <span
                      className="inline-block group-focus:translate-y-14 group-focus:skew-12 group-hover:translate-y-14 group-hover:skew-12 transition-transform duration-500 group-hover:text-(--rt-bg) group-focus:text-(--rt-bg)"
                    >
                      {link.label}
                    </span>
                    <span
                      className="inline-block absolute left-0 -top-full skew-12 group-focus:skew-0 group-focus:translate-y-full group-hover:skew-0 group-hover:translate-y-full -translate-y-full transition-transform duration-500"
                      style={{ color: "var(--rt-bg)" }}
                    >
                      {link.label}
                    </span>
                  </div>
                </Link>
              ) : (
                <Link
                  key={link.id}
                  href={generateLinkUrl(link)}
                  prefetch={true}
                  className="py-2 text-xl text-center font-bold uppercase w-full transition-opacity hover:opacity-80"
                  style={{
                    borderRadius: "var(--rt-btn-radius)",
                    backgroundColor: "var(--rt-primary)",
                    color: "var(--rt-bg)",
                  }}
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>
          <div>
            <h2
              className="text-2xl leading-none font-bold text-center"
              style={{ color: "var(--rt-text)" }}
            >
              {restaurant.name}
            </h2>
            <div className="text-center">
              <p className="text-lg" style={{ color: "var(--rt-text)" }}>
                {restaurant.description || "Disfruta de nuestra comida"}
              </p>
              {groupedHours.length > 0 && (
                <div className="mt-4 mb-4 text-sm" style={{ color: "var(--rt-text)", opacity: 0.7 }}>
                  <p className="flex items-center justify-center gap-1 font-semibold mb-2">
                    <Clock className="w-4 h-4" />
                    Horarios
                  </p>
                  <div className="space-y-1">
                    {groupedHours.map(({ day, label, periods }) => (
                      <div key={day} className="flex justify-between gap-8">
                        <span className="font-medium">{label}</span>
                        <span style={{ opacity: 0.6 }}>
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
                  className="transition-opacity hover:opacity-70"
                  style={{ color: "var(--rt-text)", opacity: 0.6 }}
                >
                  <MapPin className="inline-block mr-1 w-6 h-6" />
                  {restaurant.address}, {restaurant.city}, {restaurant.state}
                </Link>
              )}
              {restaurant.phone && (
                <p className="text-sm mt-1">
                  <Link
                    href={`https://api.whatsapp.com/send/?phone=${restaurant.phone}&text=Hola!+Quisiera+hacer+una+consulta.&app_absent=0`}
                    className="flex items-center self-center justify-center transition-opacity hover:opacity-70"
                    style={{ color: "var(--rt-text)", opacity: 0.6 }}
                  >
                    <span className="inline-block mr-1 w-5 h-5">
                      <WhatsappIcon />
                    </span>
                    {restaurant.phone}
                  </Link>
                </p>
              )}
              {(restaurant.instagramUrl || restaurant.facebookUrl || restaurant.tiktokUrl || restaurant.twitterUrl || restaurant.linkedinUrl || restaurant.websiteUrl) && (
                <div className="flex items-center justify-center gap-4 mt-3">
                  {restaurant.websiteUrl && (
                    <Link href={restaurant.websiteUrl} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70 w-6 h-6 inline-block" style={{ color: "var(--rt-text)", opacity: 0.6 }} aria-label="Sitio web">
                      <Globe className="w-full h-full" />
                    </Link>
                  )}
                  {restaurant.instagramUrl && (
                    <Link href={restaurant.instagramUrl} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70 w-6 h-6 inline-block" style={{ color: "var(--rt-text)", opacity: 0.6 }} aria-label="Instagram">
                      <InstagramIcon />
                    </Link>
                  )}
                  {restaurant.facebookUrl && (
                    <Link href={restaurant.facebookUrl} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70 w-6 h-6 inline-block" style={{ color: "var(--rt-text)", opacity: 0.6 }} aria-label="Facebook">
                      <FacebookIcon />
                    </Link>
                  )}
                  {restaurant.tiktokUrl && (
                    <Link href={restaurant.tiktokUrl} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70 w-6 h-6 inline-block" style={{ color: "var(--rt-text)", opacity: 0.6 }} aria-label="TikTok">
                      <TikTokIcon />
                    </Link>
                  )}
                  {restaurant.twitterUrl && (
                    <Link href={restaurant.twitterUrl} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70 w-6 h-6 inline-block" style={{ color: "var(--rt-text)", opacity: 0.6 }} aria-label="Twitter / X">
                      <TwitterIcon />
                    </Link>
                  )}
                  {restaurant.linkedinUrl && (
                    <Link href={restaurant.linkedinUrl} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70 w-6 h-6 inline-block" style={{ color: "var(--rt-text)", opacity: 0.6 }} aria-label="LinkedIn">
                      <LinkedInIcon />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <MangiarFooter />
    </>
  );
}
