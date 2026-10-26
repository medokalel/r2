import { useTranslation } from "react-i18next";
import type { TourStepConfig } from "@/context/tour/tourTypes";

export function useApplicationRegisterTourSteps(): TourStepConfig[] {
  const { t } = useTranslation();

  return [
    {
      id: "application-register-header",
      step: 1,
      totalSteps: 5,
      title: t(
        "cab.applicationRegister.tour.header.title",
        "Applications Register",
      ),
      description: t(
        "cab.applicationRegister.tour.header.description",
        "Overview and management of all certification applications, their current status, and submission progress.",
      ),
      side: "bottom",
      align: "start",
    },
    {
      id: "application-register-new-btn",
      step: 2,
      totalSteps: 5,
      title: t(
        "cab.applicationRegister.tour.newApplication.title",
        "New Application",
      ),
      description: t(
        "cab.applicationRegister.tour.newApplication.description",
        "Click here to initiate and submit a new conformity assessment application for a client.",
      ),
      side: "bottom",
      align: "end",
    },
    {
      id: "application-register-filters",
      step: 3,
      totalSteps: 5,
      title: t(
        "cab.applicationRegister.tour.filters.title",
        "Filter & Search",
      ),
      description: t(
        "cab.applicationRegister.tour.filters.description",
        "Quickly search by application code, client name, creation period, country, or processing stage.",
      ),
      side: "bottom",
      align: "start",
    },
    {
      id: "application-register-table",
      step: 4,
      totalSteps: 5,
      title: t(
        "cab.applicationRegister.tour.table.title",
        "Applications Table",
      ),
      description: t(
        "cab.applicationRegister.tour.table.description",
        "View application details, linked standards, current stage badges, and last update timestamps.",
      ),
      side: "top",
      align: "start",
    },
    {
      id: "application-register-actions",
      step: 5,
      totalSteps: 5,
      title: t(
        "cab.applicationRegister.tour.actions.title",
        "Actions & Navigation",
      ),
      description: t(
        "cab.applicationRegister.tour.actions.description",
        "Continue editing draft applications or navigate directly to review details and processing stages.",
      ),
      side: "left",
      align: "start",
    },
  ];
}
