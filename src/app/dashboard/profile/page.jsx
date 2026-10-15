import { ProfileView } from "../../../components/auth/AccountViews";

export const metadata = { title: "Your profile | Site Studio" };
export const instant = false;
export default function ProfilePage() {
  return <ProfileView />;
}
