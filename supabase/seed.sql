insert into public.courses(slug,code,title,category,label,price_aud,duration,description,overview,image_url,delivery_modes,entry_requirements,career_outcomes,unit_summary,availability,price_label,status_note,requires_lln,lln_test_key,lln_pass_percent,assessment_unlock_amount_cents) values
('certificate-iv-business-bsb40120','BSB40120','Certificate IV in Business','Business','Sample course',0,'Schedule to be confirmed','Build practical capability across communication, operations and workplace projects.','A sample course pathway demonstrating flexible and practical business learning.','https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=85',array['Melbourne classroom','Supported online learning'],array['Requirements will be confirmed before applications open.'],array['Team leader','Project support officer','Business operations assistant'],'Sample learning units','details-to-follow','Fees to be confirmed','Sample course only. Availability, fees and delivery details are to be confirmed.',true,'business-foundations',70,0),
('diploma-information-technology-ict50220','ICT50220','Diploma of Information Technology','Information Technology','Sample course',0,'Schedule to be confirmed','Develop applied skills across digital systems, support and technology projects.','A sample technology pathway shaped around practical projects.','https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85',array['Melbourne classroom','Supported online learning'],array['Requirements will be confirmed before applications open.'],array['ICT support officer','Systems administrator','Technology project coordinator'],'Sample learning units','details-to-follow','Fees to be confirmed','Sample course only. Availability, fees and delivery details are to be confirmed.',false,null,null,0),
('certificate-iii-individual-support-chc33021','CHC33021','Certificate III in Individual Support','Community Services','Sample course',0,'Schedule to be confirmed','Explore person-centred support skills for community and care environments.','A sample pathway centred on dignity and practical care skills.','https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=1400&q=85',array['Melbourne classroom'],array['Requirements will be confirmed before applications open.'],array['Individual support worker','Community care worker','Personal care assistant'],'Sample learning units','details-to-follow','Fees to be confirmed','Sample course only. Availability, fees and delivery details are to be confirmed.',false,null,null,0)
on conflict(slug) do update set title=excluded.title, updated_at=now();

insert into public.course_lessons(course_slug,lesson_key,title,duration,video_provider,video_url,position,is_preview) values
('certificate-iv-business-bsb40120','welcome','Welcome to practical business learning','04:00','youtube','https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0',1,true),
('certificate-iv-business-bsb40120','communication','Communication in action','12:00','youtube','https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0',2,false),
('certificate-iv-business-bsb40120','project','Planning a workplace project','12:00','youtube','https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0',3,false)
on conflict(course_slug,lesson_key) do nothing;

insert into public.course_units(course_slug,code,title,type,position) values
('certificate-iv-business-bsb40120','BSBXCM401','Apply communication strategies in the workplace','Core',1),
('certificate-iv-business-bsb40120','BSBCRT411','Apply critical thinking to work practices','Core',2),
('certificate-iv-business-bsb40120','BSBTEC404','Use digital technologies to collaborate','Elective',3),
('diploma-information-technology-ict50220','ICTICT517','Match ICT needs with organisational direction','Core',1),
('certificate-iii-individual-support-chc33021','CHCCCS031','Provide individualised support','Core',1)
on conflict(course_slug,code) do nothing;

insert into public.course_assignments(course_slug,assignment_key,title,subtitle,overview,position) values
('certificate-iv-business-bsb40120','workplace-communication','Assessment 1','Workplace communication','Plan and demonstrate a clear workplace communication approach.',1),
('certificate-iv-business-bsb40120','project-plan','Assessment 2','Workplace project plan','Prepare a practical project plan and reflect on the outcome.',2)
on conflict(course_slug,assignment_key) do nothing;
