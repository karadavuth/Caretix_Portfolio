from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)
    type = Column(String(50), nullable=False)  # scraper, api, analysis
    status = Column(String(20), default="planned")  # planned, active, completed
    completion_percentage = Column(Float, default=0.0)
    description = Column(Text)
    tech_stack = Column(Text)
    priority = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'name': self.name,
            'type': self.type,
            'status': self.status,
            'completion_percentage': self.completion_percentage,
            'priority': self.priority
        }

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    proficiency = Column(Integer, default=1)  # 1-10 scale
    practice_hours = Column(Float, default=0.0)
    last_practiced = Column(DateTime, default=datetime.utcnow)
    is_mendix_relevant = Column(Integer, default=0)  # Boolean als integer
    notes = Column(Text)
