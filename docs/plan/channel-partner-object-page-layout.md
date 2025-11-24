## Channel Partner Object Page – Redesign Blueprint

### Section Ordering

1. **Partner Overview (`PartnerOverviewSection`)**
   - `FieldGroup#PartnerHeadline`: `merchantName`, `businessType`, `phase`, `priorityScore`, `merchantScore`
   - `FieldGroup#AssignmentStatus`: `assignedTo`, `autoAssignedTo.fullName`, `lastFollowUp`, `pendingItems`, `status`
2. **Discovery Intelligence (`DiscoveryIntelligenceSection`)**
   - `FieldGroup#DiscoverySummary`: `discoverySource`, `discoveryDate`, `discoveryMetadata`
   - `FieldGroup#LocationDetails`: `address`, `city`, `state`, `country`, `postalCode`
   - `FieldGroup#ContactSocial`: `contactInfo`, `socialMediaLinks`
3. **AI Meeting Planner (`AIPlannerFacet`)**
   - Hosts fragment `AIMeetingPlannerSection.fragment.xml`
   - Bound to JSON model `aiPlanner>/content`; positioned immediately after Discovery Intelligence
4. **Insights & Risks (`InsightsRisksSection`)**
   - `FieldGroup#AIInsights`: `about`, `merchantScore`, `phaseCriticality`
   - `FieldGroup#RiskSignals`: `priorityScore`, `status`, `pendingItems`, `phase`
5. **Execution & Next Steps (`ExecutionSection`)**
   - `FieldGroup#RecommendedActions`: `pendingItems`, `phase`, `status`
   - `FieldGroup#CommercialReadiness`: `businessType`, `location`, `merchantScore`

### Notes

- Header KPIs remain via `@UI.HeaderFacets` for `merchantScore`.
- AI Meeting Initiator action (`MerchantService.initiateAIMeeting`) is retained in Identification area but intercepted client-side.
- Each FieldGroup will be defined in `srv/services/merchant-service-annotations.cds` with clear titles for the new layout.

