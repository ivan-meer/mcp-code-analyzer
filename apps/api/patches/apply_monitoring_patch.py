#!/usr/bin/env python3
# 🔧 Автоматический интегратор оптимизированного мониторинга
# Файл: patches/apply_monitoring_patch.py

"""
Скрипт для автоматического применения патча оптимизированного мониторинга.
Безопасно интегрирует новую систему с сохранением резервных копий.
"""

import os
import shutil
import sys
from pathlib import Path
from datetime import datetime
import re

class MonitoringPatchApplier:
    """Класс для применения патча мониторинга"""
    
    def __init__(self, project_root: str = None):
        if project_root:
            self.project_root = Path(project_root)
        else:
            # Автоматическое определение корня проекта
            current_dir = Path(__file__).parent
            self.project_root = current_dir.parent
        
        self.main_py_path = self.project_root / "main.py"
        self.backup_dir = self.project_root / "backups"
        
        print(f"🎯 Корень проекта: {self.project_root}")
        print(f"📄 Файл main.py: {self.main_py_path}")
    
    def create_backup(self):
        """Создание резервной копии main.py"""
        if not self.main_py_path.exists():
            raise FileNotFoundError(f"Файл {self.main_py_path} не найден")
        
        # Создаем директорию для резервных копий
        self.backup_dir.mkdir(exist_ok=True)
        
        # Создаем резервную копию с временной меткой
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.backup_dir / f"main_py_backup_{timestamp}.py"
        
        shutil.copy2(self.main_py_path, backup_path)
        
        print(f"✅ Резервная копия создана: {backup_path}")
        return backup_path
    
    def check_dependencies(self):
        """Проверка наличия необходимых файлов"""
        required_files = [
            "infrastructure/monitoring/__init__.py",
            "infrastructure/monitoring/core.py", 
            "infrastructure/monitoring/migration_adapter.py",
            "config/monitoring.py"
        ]
        
        missing_files = []
        for file_path in required_files:
            full_path = self.project_root / file_path
            if not full_path.exists():
                missing_files.append(file_path)
        
        if missing_files:
            print("❌ Отсутствуют необходимые файлы:")
            for file in missing_files:
                print(f"   - {file}")
            return False
        
        print("✅ Все необходимые файлы найдены")
        return True
    
    def read_main_py(self):
        """Чтение содержимого main.py"""
        with open(self.main_py_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def write_main_py(self, content: str):
        """Запись нового содержимого в main.py"""
        with open(self.main_py_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def add_monitoring_imports(self, content: str) -> str:
        """Добавление импортов оптимизированного мониторинга"""
        
        # Находим место для вставки (после импорта FastAPI)
        import_pattern = r"(from fastapi import.*?\n)"
        
        new_imports = """
# 🚀 Оптимизированная система мониторинга
import os
from datetime import datetime, timezone

# Импорт новой системы мониторинга
try:
    from infrastructure.monitoring.migration_adapter import (
        get_monitoring_system,
        HybridMonitoringSystem,
        EventType as NewEventType,
        LogLevel
    )
    from config.monitoring import get_hybrid_monitoring_config, ensure_log_directory
    OPTIMIZED_MONITORING_AVAILABLE = True
    print("✅ Оптимизированная система мониторинга доступна")
except ImportError as e:
    OPTIMIZED_MONITORING_AVAILABLE = False
    print(f"⚠️ Оптимизированная система мониторинга недоступна: {e}")

"""
        
        # Вставляем новые импорты
        content = re.sub(import_pattern, r"\1" + new_imports, content, count=1)
        
        return content
    
    def replace_monitoring_initialization(self, content: str) -> str:
        """Замена инициализации системы мониторинга"""
        
        # Комментируем старые импорты
        old_import_pattern = r"from monitoring_system import \((.*?)\)"
        content = re.sub(old_import_pattern, r"# from monitoring_system import (\1)", content, flags=re.DOTALL)
        
        # Добавляем новую инициализацию после глобальной переменной ai_manager
        ai_manager_pattern = r"(ai_manager = None)"
        
        monitoring_init = r"""\1

# =================== ИНИЦИАЛИЗАЦИЯ ОПТИМИЗИРОВАННОГО МОНИТОРИНГА ===================

# Инициализация системы мониторинга с автоматическим выбором
if OPTIMIZED_MONITORING_AVAILABLE:
    # Создаем оптимизированную систему
    ensure_log_directory()
    monitoring_config = get_hybrid_monitoring_config()
    optimized_monitoring = get_monitoring_system()
    
    # Определяем, какую систему использовать
    USE_OPTIMIZED_MONITORING = monitoring_config.get('use_new_system', True)
    COMPARE_MONITORING_SYSTEMS = monitoring_config.get('compare_systems', False)
    
    print(f"🚀 Система мониторинга инициализирована:")
    print(f"   └─ Оптимизированная: {USE_OPTIMIZED_MONITORING}")
    print(f"   └─ Сравнение систем: {COMPARE_MONITORING_SYSTEMS}")
else:
    # Fallback на старую систему
    optimized_monitoring = None
    USE_OPTIMIZED_MONITORING = False
    COMPARE_MONITORING_SYSTEMS = False
    print("⚠️ Используется старая система мониторинга")

# ==============================================================================="""
        
        content = re.sub(ai_manager_pattern, monitoring_init, content)
        
        return content
    
    def update_analyze_endpoint(self, content: str) -> str:
        """Обновление endpoint анализа для использования новой системы"""
        
        # Находим функцию analyze_project
        analyze_pattern = r"(@app\.post\(\"/api/analyze\".*?async def analyze_project\(.*?\):.*?)(session_id = str\(uuid\.uuid4\(\)\))"
        
        replacement = r"""\1session_id = str(uuid.uuid4())
    
    # 🚀 Используем оптимизированную систему мониторинга если доступна
    if USE_OPTIMIZED_MONITORING and optimized_monitoring:
        monitoring_system = optimized_monitoring
        event_type = NewEventType.ANALYSIS_START
    else:
        # Fallback на старую систему
        from monitoring_system import analytics_logger, EventType
        monitoring_system = analytics_logger
        event_type = EventType.ANALYSIS_START"""
        
        content = re.sub(analyze_pattern, replacement, content, flags=re.DOTALL)
        
        return content
    
    def update_track_operation_calls(self, content: str) -> str:
        """Обновление вызовов track_operation для новой системы"""
        
        # Заменяем вызовы analytics_logger.track_operation
        track_operation_pattern = r"analytics_logger\.track_operation\("
        replacement = "monitoring_system.track_operation("
        
        content = re.sub(track_operation_pattern, replacement, content)
        
        # Заменяем вызовы track_analysis_operation
        track_analysis_pattern = r"track_analysis_operation\("
        content = re.sub(track_analysis_pattern, replacement, content)
        
        return content
    
    def update_health_endpoints(self, content: str) -> str:
        """Обновление health check endpoints"""
        
        # Обновляем health check функцию
        health_pattern = r"(async def health_check\(\):.*?)(health_data = get_system_health\(\))"
        
        replacement = r"""\1# 🚀 Используем оптимизированную систему мониторинга
    if USE_OPTIMIZED_MONITORING and optimized_monitoring:
        health_data = optimized_monitoring.health_check()
    else:
        # Fallback на старую систему
        health_data = get_system_health()"""
        
        content = re.sub(health_pattern, replacement, content, flags=re.DOTALL)
        
        return content
    
    def apply_patch(self):
        """Применение полного патча"""
        print("🔧 Начинаем применение патча оптимизированного мониторинга...")
        
        # Проверяем зависимости
        if not self.check_dependencies():
            print("❌ Не удается применить патч: отсутствуют зависимости")
            return False
        
        # Создаем резервную копию
        backup_path = self.create_backup()
        
        try:
            # Читаем текущий main.py
            content = self.read_main_py()
            
            # Применяем все модификации
            print("📝 Добавляем импорты...")
            content = self.add_monitoring_imports(content)
            
            print("🔄 Обновляем инициализацию мониторинга...")
            content = self.replace_monitoring_initialization(content)
            
            print("🎯 Обновляем endpoint анализа...")
            content = self.update_analyze_endpoint(content)
            
            print("🔗 Обновляем вызовы track_operation...")
            content = self.update_track_operation_calls(content)
            
            print("🩺 Обновляем health endpoints...")
            content = self.update_health_endpoints(content)
            
            # Записываем обновленный файл
            self.write_main_py(content)
            
            print(f"✅ Патч успешно применен!")
            print(f"📁 Резервная копия: {backup_path}")
            
            return True
            
        except Exception as e:
            print(f"❌ Ошибка при применении патча: {e}")
            print("🔄 Восстанавливаем из резервной копии...")
            
            # Восстанавливаем из резервной копии
            shutil.copy2(backup_path, self.main_py_path)
            print("✅ Файл восстановлен из резервной копии")
            
            return False
    
    def validate_patch(self):
        """Валидация применения патча"""
        print("🔍 Валидация применения патча...")
        
        content = self.read_main_py()
        
        # Проверяем наличие ключевых элементов
        checks = [
            ("Импорт оптимизированного мониторинга", "OPTIMIZED_MONITORING_AVAILABLE"),
            ("Инициализация системы", "optimized_monitoring = get_monitoring_system()"),
            ("Использование новой системы", "USE_OPTIMIZED_MONITORING"),
            ("Обновленные вызовы", "monitoring_system.track_operation(")
        ]
        
        passed_checks = 0
        for check_name, check_pattern in checks:
            if check_pattern in content:
                print(f"   ✅ {check_name}")
                passed_checks += 1
            else:
                print(f"   ❌ {check_name}")
        
        success_rate = (passed_checks / len(checks)) * 100
        print(f"\n📊 Успешность применения патча: {success_rate:.1f}%")
        
        return passed_checks == len(checks)

def main():
    """Главная функция"""
    print("🚀 Автоматический интегратор оптимизированного мониторинга")
    print("=" * 60)
    
    # Определяем корень проекта
    if len(sys.argv) > 1:
        project_root = sys.argv[1]
    else:
        project_root = None
    
    try:
        # Создаем и применяем патч
        patcher = MonitoringPatchApplier(project_root)
        
        if patcher.apply_patch():
            if patcher.validate_patch():
                print("\n🎉 Патч успешно применен и валидирован!")
                print("\n📋 Следующие шаги:")
                print("   1. Запустите тесты: python tests/test_monitoring_optimization.py")
                print("   2. Проверьте логи в директории logs/")
                print("   3. Настройте переменные окружения при необходимости")
            else:
                print("\n⚠️ Патч применен, но валидация не прошла полностью")
        else:
            print("\n❌ Не удалось применить патч")
            
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
