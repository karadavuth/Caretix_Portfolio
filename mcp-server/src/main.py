import os
import sys
from pathlib import Path

# Add current directory to Python path
sys.path.append(str(Path(__file__).parent))

from fastmcp import FastMCP
from dotenv import load_dotenv
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.project import Base, Project, Skill

# Load environment variables
load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///portfolio.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# MCP Server
mcp = FastMCP(name="mendix-portfolio-assistant")

@mcp.tool()
def create_project(name: str, project_type: str, description: str, priority: int = 5) -> str:
    """Nieuw portfolio project aanmaken"""
    db = SessionLocal()
    try:
        # Check if project exists
        existing = db.query(Project).filter(Project.name == name).first()
        if existing:
            return f"❌ Project '{name}' bestaat al!"
        
        # Create new project
        project = Project(
            name=name,
            type=project_type,
            description=description,
            priority=priority
        )
        db.add(project)
        db.commit()
        
        return f"""✅ Project '{name}' succesvol aangemaakt!
📋 Type: {project_type}
🎯 Prioriteit: {priority}/10
📝 Beschrijving: {description}"""
        
    except Exception as e:
        return f"❌ Fout bij aanmaken project: {str(e)}"
    finally:
        db.close()

@mcp.tool()
def update_project_progress(project_name: str, completion_percentage: float, status: str = None) -> str:
    """Project voortgang bijwerken"""
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.name == project_name).first()
        if not project:
            return f"❌ Project '{project_name}' niet gevonden"
        
        old_percentage = project.completion_percentage
        project.completion_percentage = completion_percentage
        if status:
            project.status = status
        project.updated_at = datetime.utcnow()
        
        db.commit()
        
        # Visual progress bar
        progress_filled = int(completion_percentage / 10)
        progress_empty = 10 - progress_filled
        progress_bar = "▓" * progress_filled + "░" * progress_empty
        
        improvement = completion_percentage - old_percentage
        
        result = f"""🚀 Project '{project_name}' bijgewerkt!
📊 Voortgang: [{progress_bar}] {completion_percentage}%
📈 Vooruitgang: +{improvement}%"""
        
        if status:
            result += f"\n🏷️ Status: {status}"
        
        return result
        
    except Exception as e:
        return f"❌ Fout bij bijwerken: {str(e)}"
    finally:
        db.close()

@mcp.tool()
def track_skill(skill_name: str, category: str, proficiency: int, mendix_relevant: bool = False, notes: str = "") -> str:
    """Vaardigheid bijhouden"""
    db = SessionLocal()
    try:
        skill = db.query(Skill).filter(Skill.name == skill_name).first()
        
        if skill:
            old_proficiency = skill.proficiency
            skill.proficiency = proficiency
            skill.last_practiced = datetime.utcnow()
            improvement = proficiency - old_proficiency
        else:
            skill = Skill(
                name=skill_name,
                category=category,
                proficiency=proficiency,
                is_mendix_relevant=1 if mendix_relevant else 0,
                notes=notes
            )
            db.add(skill)
            improvement = proficiency
        
        db.commit()
        
        # Skill visualization
        skill_stars = "⭐" * proficiency + "☆" * (10 - proficiency)
        
        result = f"""🎯 Skill '{skill_name}' bijgewerkt!
📊 Niveau: {skill_stars} ({proficiency}/10)
📂 Categorie: {category}"""
        
        if improvement > 0:
            result += f"\n📈 Verbetering: +{improvement} niveau!"
        
        if mendix_relevant:
            result += "\n🎯 Mendix relevant: Ja"
        
        return result
        
    except Exception as e:
        return f"❌ Fout bij skill tracking: {str(e)}"
    finally:
        db.close()

@mcp.tool()
def get_portfolio_status() -> str:
    """Complete portfolio overzicht"""
    db = SessionLocal()
    try:
        projects = db.query(Project).all()
        skills = db.query(Skill).all()
        
        result = "🎯 MENDIX PORTFOLIO DASHBOARD\n"
        result += "=" * 50 + "\n\n"
        
        # Projects
        result += "📋 PROJECTEN:\n"
        for project in sorted(projects, key=lambda x: x.priority, reverse=True):
            progress_filled = int(project.completion_percentage / 10)
            progress_bar = "▓" * progress_filled + "░" * (10 - progress_filled)
            
            status_icons = {
                "planned": "📋",
                "active": "🚀", 
                "completed": "✅"
            }
            
            result += f"{status_icons.get(project.status, '📋')} {project.name}\n"
            result += f"   [{progress_bar}] {project.completion_percentage}% | Priority: {project.priority}/10\n\n"
        
        # Skills
        if skills:
            result += "🎯 TOP VAARDIGHEDEN:\n"
            top_skills = sorted(skills, key=lambda x: x.proficiency, reverse=True)[:5]
            for skill in top_skills:
                skill_stars = "⭐" * skill.proficiency + "☆" * (10 - skill.proficiency)
                mendix_indicator = " 🎯" if skill.is_mendix_relevant else ""
                result += f"• {skill.name}: {skill_stars} ({skill.proficiency}/10){mendix_indicator}\n"
        
        # Statistics
        total_practice = sum(s.practice_hours for s in skills)
        completed_projects = len([p for p in projects if p.status == "completed"])
        mendix_skills = len([s for s in skills if s.is_mendix_relevant])
        
        result += f"\n📊 STATISTIEKEN:\n"
        result += f"• Projecten voltooid: {completed_projects}/{len(projects)}\n"
        result += f"• Totale oefentijd: {total_practice:.1f} uur\n"
        result += f"• Mendix skills: {mendix_skills}/{len(skills)}\n"
        
        return result
        
    except Exception as e:
        return f"❌ Fout bij dashboard: {str(e)}"
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting Mendix Portfolio MCP Server...")
    print(f"📊 Database: {DATABASE_URL}")
    print(f"🌐 Server: {os.getenv('MCP_HOST', '127.0.0.1')}:{os.getenv('MCP_PORT', 8000)}")
    print("✅ Server ready!")
    
    mcp.run(
        transport="http",
        host=os.getenv("MCP_HOST", "127.0.0.1"),
        port=int(os.getenv("MCP_PORT", 8000))
    )
