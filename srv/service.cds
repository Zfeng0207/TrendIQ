// in srv/service.cds
using { beauty.leads as db } from '../db/schema';

service LeadService {
    @readonly
    entity Leads as projection on db.Leads;
}