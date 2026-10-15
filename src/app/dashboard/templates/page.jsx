import TemplateLibrary from "../../../components/templates/TemplateLibrary";
import { templateSections } from "../../../lib/site-validation.js";
export const metadata = { title: "Templates | Site Studio" };
export const instant = false;
export default function TemplatesPage() {
  return <TemplateLibrary templateSections={templateSections} />;
}
