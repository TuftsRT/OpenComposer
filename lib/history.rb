helpers do
  # Generate HTML for icons linking to related applications.
  def output_related_apps_icon(job_app_path, apps)
    return [] if apps.nil?

    apps.map do |name, conf|
      href = "#{@my_ood_url}/pun/sys/dashboard/apps/show/#{name}"
      icon = conf&.dig('icon')
      if icon.nil?
        icon_path = "#{@my_ood_url}/pun/sys/dashboard/apps/icon/#{name}/sys/sys"
        icon_html = "<img width=20 title=\"#{name}\" alt=\"#{name}\" src=\"#{icon_path}\">"
      else
        is_bi_or_fa_icon, icon_path = get_icon_path(job_app_path, icon)

        # Generate icon HTML based on whether it's a Bootstrap/Font Awesome icon or an image
        icon_html = if is_bi_or_fa_icon
                      "<i class=\"#{icon} fs-5\"></i>"
                    else
                      "<img width=20 title=\"#{name}\" alt=\"#{name}\" src=\"#{icon_path}\">"
                    end
      end

      # Return the full HTML string for the link
      "<a style=\"color: black; text-decoration: none;\" target=\"_blank\" href=\"#{href}\">\n  #{icon_html}\n</a>\n"
    end
  end

  # Output a modal for a specific action (e.g., CancelJob or DeleteInfo).
  def output_action_modal(action)
    id = "_history#{action}"
    form_action = "#{@script_name}/history"
    query_params = []
    query_params << "cluster=#{@cluster_name}" if @cluster_name
    query_params << "rows=#{@rows}" if @rows != HISTORY_ROWS
    query_params << "p=#{@current_page}" if @current_page != 1
    form_action += "?#{query_params.join('&')}" unless query_params.empty?

    <<~HTML
    <div class="modal" id="#{id}" aria-hidden="true" tabindex="-1">
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-body" id="#{id}Body">
            (Something wrong)
          </div>
          <div class="modal-footer">
            <form action="#{form_action}" method="post" id="#{id}Form">
              <input type="hidden" name="action" value="#{action}">
              <input type="hidden" name="JobIds" id="#{id}Input">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" tabindex="-1">Cancel</button>
              <button type="submit" class="btn btn-primary" tabindex="-1">OK</button>
            </form>
          </div>
        </div>
      </div>
    </div>
    HTML
  end

  # Output a badge for an action button (e.g., CancelJob or DeleteInfo) with a modal trigger.
  def output_action_badge(action)
    return if action != "CancelJob" && action != "DeleteInfo"

    <<~HTML
    <button id="_history#{action}Badge" data-bs-toggle="modal" data-bs-target="#_history#{action}" class="btn btn-sm btn-danger disabled" disabled>
      #{(action == "CancelJob") ? "Cancel Job" : "Delete Info"}
      <span id="_history#{action}Count" class="badge bg-secondary">0</span>
    </button>
    HTML
  end

  # Output a modal for displaying details of a specific job.
  def output_job_id_modal(job, filter)
    return if job[JOB_KEYS].nil? # If a job has just been submitted, it may not have been registered yet.

    modal_id = "_historyJobId#{job[JOB_ID]}"
    html = <<~HTML
    <div class="modal" aria-hidden="true" id="#{modal_id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-scrollable modal-lg">
        <div class="modal-content" style="resize: horizontal; padding-right: 16px;">
          <div class="modal-header">
            <h5>Job Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <table class="table table-striped table-sm text-break">
    HTML

    filtered_keys = job[JOB_KEYS] - [JOB_NAME, JOB_PARTITION, JOB_STATUS_ID]
    filtered_keys.each do |key|
      html += "<tr><td>#{output_text(key, filter)}</td><td>#{output_text(job[key], filter)}</td></tr>\n"
    end

    html += <<~HTML
            </table>
          </div>
        </div>
      </div>
    </div>
    HTML
  end

  # Output a modal displaying a job script and a link to load parameters for a specific job.
  def output_job_script_modal(job, filter)
    modal_id = "_historyJobScript#{job[JOB_ID]}"
    job_link = "#{File.join(@script_name, job[JOB_DIR_NAME])}?jobId=#{URI.encode_www_form_component(job[JOB_ID])}"
    job_link += "&cluster=#{@cluster_name}" if @cluster_name

    <<~HTML
    <div class="modal" aria-hidden="true" id="#{modal_id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-scrollable modal-lg">
        <div class="modal-content" style="resize: horizontal; padding-right: 16px;">
          <div class="modal-header">
            <h5>Job Script</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            #{output_text(job[OC_SCRIPT_CONTENT], filter)}
          </div>
          <div class="modal-footer">
            <a href="#{job_link}" class="btn btn-primary text-white text-decoration-none">Load parameters</a>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" tabindex="-1">Close</button>
          </div>
        </div>
      </div>
    </div>
    HTML
  end

  # Output a pagination link for history navigation.
  def output_link(is_active, i, rows = 1)
    if is_active
      "<li class=\"page-item active\"><a href=\"#\" class=\"page-link\">#{i}</a></li>\n"
    elsif i == "..."
      "<li class=\"page-item\"><a href=\"#\" class=\"page-link\">...</a></li>\n"
    else
      link = "./history?status=#{@status}&p=#{i}&rows=#{@rows}"
      link += "&cluster=#{@cluster_name}" if @cluster_name
      link += "&filter=#{@filter}" if @filter && !@filter.empty?
      "<li class=\"page-item\"><a href=\"#{link}\" class=\"page-link\">#{i}</a></li>\n"
    end
  end

  # Output a pagination component for navigating through pages of history records.
  def output_pagination(current_page, page_size, rows)
    html = "<nav class=\"mt-1\">\n"
    html += "  <ul class=\"pagination justify-content-center\">\n"

    if current_page == 1
      html += "    <li class=\"page-item disabled\"><a href=\"#\" class=\"page-link\">&laquo;</a></li>\n"
    else
      previous_link = "./history?status=#{@status}&p=#{current_page-1}&rows=#{@rows}"
      previous_link += "&cluster=#{@cluster_name}" if @cluster_name
      previous_link += "&filter=#{@filter}" if @filter && !@filter.empty?
      html += "    <li class=\"page-item\"><a href=\"#{previous_link}\" class=\"page-link\">&laquo;</a></li>\n"
    end

    if page_size <= 7
      (1..page_size).each do |i|
        html += output_link(current_page == i, i, rows)
      end
    else
      if current_page <= 4
        (1..5).each { |i| html += output_link(current_page == i, i, rows) }
        html += output_link(false, "...")
        html += output_link(false, page_size, rows)
      elsif current_page >= page_size - 3
        html += output_link(false, 1, rows)
        html += output_link(false, "...")
        ((page_size - 4)..page_size).each { |i| html += output_link(current_page == i, i, rows) }
      else
        html += output_link(false, 1, rows)
        html += output_link(false, "...")
        html += output_link(false, current_page - 1, rows)
        html += output_link(true, current_page, rows)
        html += output_link(false, current_page + 1, rows)
        html += output_link(false, "...")
        html += output_link(false, page_size, rows)
      end
    end

    if current_page == page_size
      html += "   <li class=\"page-item disabled\"><a href=\"#\" class=\"page-link\">&raquo;</a></li>\n"
    else
      next_link = "./history?status=#{@status}&p=#{current_page+1}&rows=#{@rows}"
      next_link += "&cluster=#{@cluster_name}" if @cluster_name
      next_link += "&filter=#{@filter}" if @filter && !@filter.empty?
      html += "   <li class=\"page-item\"><a href=\"#{next_link}\" class=\"page-link\">&raquo;</a></li>\n"
    end

    html += "  </ul>\n"
    html += "</nav>\n"
  end

  # Return history DB
  def get_history_db(conf, cluster_name)
    db = conf["history_db"]
    return db unless db.is_a?(Hash)

    cluster_db = db[cluster_name]
    halt 500, "#{cluster_name} is invalid." unless cluster_db

    return cluster_db
  end

  # Return a legacy PStore DB path from the current configuration.
  def get_legacy_history_db(conf, cluster_name)
    if conf.key?("clusters")
      halt 500, "#{cluster_name} is invalid." unless cluster_name
      return File.join(conf["data_dir"], "#{cluster_name}.db")
    end

    return File.join(conf["data_dir"], "#{conf["scheduler"]}.db")
  end

  # Open a SQLite history DB and ensure the required schema exists.
  def open_history_db(conf, cluster_name)
    sqlite_path = get_history_db(conf, cluster_name)
    legacy_path = get_legacy_history_db(conf, cluster_name)
    migrate_pstore_to_sqlite(sqlite_path, legacy_path, conf) if !File.exist?(sqlite_path) && File.exist?(legacy_path)

    db = SQLite3::Database.new(sqlite_path)
    db.results_as_hash = true
    setup_history_db(db)
    db
  end

  # Create the required tables and indexes if they do not exist yet.
  def setup_history_db(db)
    db.execute_batch(<<~SQL)
      CREATE TABLE IF NOT EXISTS jobs (
        job_id TEXT PRIMARY KEY,
        app_name TEXT,
        app_dir_name TEXT,
        script_location TEXT,
        script_name TEXT,
        job_name TEXT,
        partition TEXT,
        submission_time TEXT,
        updated_time TEXT,
        status TEXT,
        payload_json TEXT NOT NULL DEFAULT '{}',
        search_text TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_submission_time ON jobs(submission_time);
      CREATE INDEX IF NOT EXISTS idx_jobs_updated_time ON jobs(updated_time);
    SQL
  end

  # Return one job record by ID.
  def find_job(db, job_id)
    db.get_first_row("SELECT * FROM jobs WHERE job_id = ?", [job_id])
  end

  # Insert or update a job record.
  def upsert_job(db, record)
    params = [
      record["job_id"],
      record["app_name"],
      record["app_dir_name"],
      record["script_location"],
      record["script_name"],
      record["job_name"],
      record["partition"],
      record["submission_time"],
      record["updated_time"],
      record["status"],
      record["payload_json"],
      record["search_text"]
    ]

    db.execute(<<~SQL, params)
      INSERT INTO jobs (
        job_id,
        app_name,
        app_dir_name,
        script_location,
        script_name,
        job_name,
        partition,
        submission_time,
        updated_time,
        status,
        payload_json,
        search_text
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(job_id) DO UPDATE SET
        app_name = excluded.app_name,
        app_dir_name = excluded.app_dir_name,
        script_location = excluded.script_location,
        script_name = excluded.script_name,
        job_name = excluded.job_name,
        partition = excluded.partition,
        submission_time = excluded.submission_time,
        updated_time = excluded.updated_time,
        status = excluded.status,
        payload_json = excluded.payload_json,
        search_text = excluded.search_text
    SQL
  end

  # Delete one job record.
  def delete_job(db, job_id)
    db.execute("DELETE FROM jobs WHERE job_id = ?", [job_id])
  end

  # Yield each job record.
  def each_job(db, &block)
    db.execute("SELECT * FROM jobs ORDER BY submission_time DESC, job_id DESC", &block)
  end

  # Return all unfinished job IDs.
  def get_unfinished_job_ids(db)
    db.execute(<<~SQL, [JOB_STATUS["completed"], JOB_STATUS["failed"]]).map { |row| row["job_id"] }
      SELECT job_id
      FROM jobs
      WHERE status IS NULL OR (status != ? AND status != ?)
      ORDER BY submission_time DESC, job_id DESC
    SQL
  end

  # Return one metadata value.
  def get_metadata(db, key)
    row = db.get_first_row("SELECT value FROM metadata WHERE key = ?", [key])
    row && row["value"]
  end

  # Insert or update one metadata value.
  def set_metadata(db, key, value)
    db.execute(<<~SQL, [key, value])
      INSERT INTO metadata (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value
    SQL
  end

  # Merge incoming data into existing data while preserving existing values for nil/empty updates.
  def merge_job_data(existing, incoming)
    merged = (existing || {}).dup
    (incoming || {}).each do |key, value|
      next if value.nil?
      next if value.is_a?(String) && value.empty?

      merged[key] = value
    end
    merged
  end

  # Return the keys that are stored as dedicated columns instead of payload_json.
  def job_record_column_keys
    %w[
      job_id
      app_name
      app_dir_name
      script_location
      script_name
      job_name
      partition
      submission_time
      updated_time
      status
    ]
  end

  # Build payload data by excluding dedicated column keys.
  def build_payload_hash(record_hash)
    (record_hash || {}).each_with_object({}) do |(key, value), payload|
      next if job_record_column_keys.include?(key.to_s)
      payload[key.to_s] = value
    end
  end

  # Build a stable signature for history search configuration.
  def build_history_signature(history_conf)
    keys = Array(history_conf).map do |item|
      if item.is_a?(Hash)
        item.keys
      else
        item
      end
    end.flatten.compact.map(&:to_s).sort

    Digest::SHA256.hexdigest(keys.join("\n"))
  end

  # Return the normalized search key for a history field.
  def normalize_history_search_key(key)
    {
      "OC_HISTORY_JOB_NAME" => "job_name",
      "OC_HISTORY_PARTITION" => "partition",
      "OC_HISTORY_SUBMISSION_TIME" => "submission_time"
    }[key] || key
  end

  # Build the search text from mandatory fields and configured history fields.
  def build_search_text(record, payload_hash, conf)
    payload_hash ||= {}

    mandatory_keys = %w[job_id app_name script_name status]
    configured_keys = Array(conf["history"]).map do |item|
      if item.is_a?(Hash)
        item.keys
      else
        item
      end
    end.flatten.compact.map { |key| normalize_history_search_key(key.to_s) }

    keys = (mandatory_keys + configured_keys).uniq - %w[submission_time updated_time]
    values = keys.flat_map do |key|
      value = record[key] || record[key.to_sym] || payload_hash[key]
      Array(value)
    end

    values
      .compact
      .map(&:to_s)
      .map { |value| value.gsub(/\s+/, " ").strip }
      .reject(&:empty?)
      .join(" ")
      .downcase
  end

  # Build a SQLite job record from existing, submit, and scheduler data.
  def build_job_record(existing:, submit_data:, scheduler_data:, conf:)
    merged = merge_job_data({}, existing)
    merged = merge_job_data(merged, submit_data)
    merged = merge_job_data(merged, scheduler_data)

    record = {
      "job_id" => merged["job_id"],
      "app_name" => merged["app_name"],
      "app_dir_name" => merged["app_dir_name"],
      "script_location" => merged["script_location"],
      "script_name" => merged["script_name"],
      "job_name" => merged["job_name"] || "",
      "partition" => merged["partition"] || "",
      "submission_time" => merged["submission_time"],
      "updated_time" => merged["updated_time"],
      "status" => merged["status"]
    }

    payload_hash = build_payload_hash(merged)
    record["payload_json"] = JSON.generate(payload_hash)
    record["search_text"] = build_search_text(record, payload_hash, conf)
    record
  end

  # Normalize a time string into ISO 8601 using the local timezone.
  def normalize_time_for_db(value)
    return nil if value.nil?

    string = value.to_s.strip
    return nil if string.empty?

    Time.parse(string).iso8601
  rescue ArgumentError
    nil
  end

  # Migrate one legacy PStore DB into a SQLite DB.
  def migrate_pstore_to_sqlite(sqlite_path, legacy_path, conf)
    FileUtils.mkdir_p(File.dirname(sqlite_path))

    db = SQLite3::Database.new(sqlite_path)
    db.results_as_hash = true
    setup_history_db(db)

    begin
      db.transaction
      store = PStore.new(legacy_path)
      store.transaction(true) do
        store.roots.each do |job_id|
          data = store[job_id]
          next unless data

          upsert_job(db, convert_pstore_record_to_sqlite(job_id.to_s, data, conf))
        end
      end
      set_metadata(db, "history_signature", build_history_signature(conf["history"]))
      db.commit
    rescue StandardError
      db.rollback
      db.close if db
      File.delete(sqlite_path) if File.exist?(sqlite_path)
      raise
    end

    db.close
  end

  # Convert a legacy PStore record into a SQLite job record.
  def convert_pstore_record_to_sqlite(job_id, data, conf)
    legacy = (data || {}).transform_keys(&:to_s)

    submission_time = normalize_time_for_db(legacy[JOB_SUBMISSION_TIME.to_s])
    merged = legacy.merge(
      "job_id" => job_id,
      "app_name" => legacy[JOB_APP_NAME.to_s],
      "app_dir_name" => legacy[JOB_DIR_NAME.to_s],
      "script_location" => legacy[HEADER_SCRIPT_LOCATION.to_s],
      "script_name" => legacy[HEADER_SCRIPT_NAME.to_s],
      "job_name" => legacy[JOB_NAME.to_s] || legacy[HEADER_JOB_NAME.to_s] || "",
      "partition" => legacy[JOB_PARTITION.to_s] || legacy["partition"] || "",
      "submission_time" => submission_time,
      "updated_time" => submission_time,
      "status" => legacy[JOB_STATUS_ID.to_s]
    )

    build_job_record(existing: nil, submit_data: merged, scheduler_data: nil, conf: conf)
  end

  # Parse payload_json and merge it back with dedicated columns using legacy key names.
  def job_record_to_legacy_hash(record)
    return nil unless record

    payload_hash = JSON.parse(record["payload_json"] || "{}")
    payload_hash.merge(
      JOB_APP_NAME => record["app_name"],
      JOB_DIR_NAME => record["app_dir_name"],
      HEADER_SCRIPT_LOCATION => record["script_location"],
      HEADER_SCRIPT_NAME => record["script_name"],
      JOB_NAME => record["job_name"].to_s.empty? ? payload_hash[HEADER_JOB_NAME] : record["job_name"],
      JOB_PARTITION => record["partition"].to_s.empty? ? payload_hash["partition"] : record["partition"],
      JOB_SUBMISSION_TIME => record["submission_time"],
      JOB_STATUS_ID => record["status"]
    )
  end

  # Ensure search_text matches the current history configuration.
  def ensure_search_text_up_to_date(db, conf)
    current_signature = build_history_signature(conf["history"])
    return if get_metadata(db, "history_signature") == current_signature

    db.transaction
    begin
      each_job(db) do |job|
        payload_hash = JSON.parse(job["payload_json"] || "{}")
        search_text = build_search_text(job, payload_hash, conf)
        db.execute("UPDATE jobs SET search_text = ? WHERE job_id = ?", [search_text, job["job_id"]])
      end
      set_metadata(db, "history_signature", current_signature)
      db.commit
    rescue StandardError
      db.rollback
      raise
    end
  end

  # Update the status of all jobs that are not completed
  def update_status(conf, scheduler, bin, bin_overrides, ssh_wrapper, cluster_name)
    db = open_history_db(conf, cluster_name)
    queried_ids = get_unfinished_job_ids(db)
    return nil if queried_ids.empty?

    scheduler     = cluster_name ? scheduler[cluster_name]     : scheduler
    ssh_wrapper   = cluster_name ? ssh_wrapper[cluster_name]   : ssh_wrapper
    bin           = cluster_name ? bin[cluster_name]           : bin
    bin_overrides = cluster_name ? bin_overrides[cluster_name] : bin_overrides
    ENV['SGE_ROOT'] ||= cluster_name ? conf["sge_root"][cluster_name] : conf["sge_root"]

    status, error_msg = scheduler.query(queried_ids, bin, bin_overrides, ssh_wrapper)
    return error_msg if error_msg

    db.transaction do
      status.each do |id, info|
        record = find_job(db, id)
        next unless record

        existing = job_record_to_legacy_hash(record)
        scheduler_data = (info || {}).transform_keys(&:to_s)
        scheduler_data["status"] = scheduler_data[JOB_STATUS_ID.to_s]
        scheduler_data["script_location"] = scheduler_data[HEADER_SCRIPT_LOCATION.to_s]
        scheduler_data["script_name"] = scheduler_data[HEADER_SCRIPT_NAME.to_s]
        scheduler_data["job_name"] = scheduler_data[JOB_NAME.to_s]
        scheduler_data["partition"] = scheduler_data[JOB_PARTITION.to_s]
        scheduler_data["updated_time"] = Time.now.iso8601
        scheduler_data[JOB_KEYS.to_s] = info.keys

        upsert_job(
          db,
          build_job_record(
            existing: existing,
            submit_data: nil,
            scheduler_data: scheduler_data,
            conf: conf
          )
        )
      end
    end

    return nil
  end

  # Return all jobs that match the specified status and filter.
  def get_all_jobs(conf, cluster_name, status, filter)
    jobs = []
    db = open_history_db(conf, cluster_name)
    ensure_search_text_up_to_date(db, conf)

    filter_text = CGI.unescapeHTML(filter.to_s).downcase
    each_job(db) do |row|
      next if status && status != "all" && row["status"] != JOB_STATUS[status]
      next if !filter_text.empty? && !row["search_text"].to_s.include?(filter_text)

      info = { JOB_ID => row["job_id"] }.merge(job_record_to_legacy_hash(row))
      jobs << info
    end

    return jobs
  end

  # Output a styled status badge for a job based on its current status.
  def output_status(job_status)
    badge_class, status_text = case job_status
                               when JOB_STATUS["queued"]
                                 ["bg-warning text-dark", "Queued"]
                               when JOB_STATUS["running"]
                                 ["bg-primary", "Running"]
                               when JOB_STATUS["completed"]
                                 ["bg-secondary", "Completed"]
                               when JOB_STATUS["failed"]
                                 ["bg-danger", "Failed"]
                               else
                                 ["bg-info", "Unknown"]
                               end

    "<span class=\"badge fs-6 #{badge_class}\">#{status_text}</span>\n"
  end

  # Return the value for the cell with the filter highlighted.
  def output_text(text, filter)
    text = if text.nil? || filter.nil? || filter.empty?
             escape_html(text)
           else
             # If it is not replaced after escape, the replacement tag will be escaped.
             escape_html(text).gsub(/(#{Regexp.escape(filter)})/i, '<span class="bg-warning text-dark">\1</span>')
           end

    return text.gsub("\n", "<br>")
  end
end
